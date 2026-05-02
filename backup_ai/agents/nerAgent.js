/**
 * nerAgent.js — On-device Medical NER for ASHA worker voice input
 *
 * Parses Hindi + English mixed medical speech-to-text output.
 * Zero server calls — pure regex, runs offline on Redmi 9A in < 1ms.
 *
 * Handles:
 *   • Blood pressure  — "BP 150 by 90" / "150/90" / "pressure 120 over 80" / "150 se 90"
 *   • Weight          — "vajan 54" / "54 kilo" / "weight 62.5 kg"
 *   • LMP             — "LMP 5 march" / "lmp 12 jan 2026" / "pichla mahavari 3 april"
 *   • Symptoms        — edema/sujan, fever/bukhar, bleeding/khoon, headache/sir dard,
 *                       nausea/ulti, fatigue/kamzori, pain/dard, vomiting
 *   • Risk calc       — returns 'high' | 'medium' | 'low' based on BP + symptoms
 */

// ── Month lookup (Hindi aliases included) ─────────────────────────────────────
const MONTH_MAP = {
  jan: '01', january: '01', jan: '01',
  feb: '02', february: '02',
  mar: '03', march: '03', maret: '03',
  apr: '04', april: '04',
  may: '05', mai: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

function monthToNum(m) {
  return MONTH_MAP[m.toLowerCase().slice(0, 3)] || '01';
}

// ── Symptom keyword map ───────────────────────────────────────────────────────
const SYMPTOM_PATTERNS = [
  { key: 'edema',     re: /sujan|edema|swelling|pair.*bhari|haath.*bhari/i },
  { key: 'fever',     re: /bukhar|fever|bukhaar|tap/i },
  { key: 'bleeding',  re: /bleeding|khoon|blood|rakt/i },
  { key: 'headache',  re: /sir.?dard|headache|sar.?dard|migraine/i },
  { key: 'nausea',    re: /ulti|nausea|ji.*machlana|vomit|matli/i },
  { key: 'fatigue',   re: /kamzori|thakaan|fatigue|tired|weakness/i },
  { key: 'pain',      re: /dard|pain|pida|ache/i },
  { key: 'dizziness', re: /chakkar|dizziness|dizzy|ghabrahat/i },
];

/**
 * parseMedical(text)
 * @param {string} text — raw STT output, Hindi/English mix
 * @returns {{
 *   bp_sys: number|null,
 *   bp_dia: number|null,
 *   weight_kg: number|null,
 *   lmp_date: string|null,      // ISO format: "2026-03-05"
 *   symptoms: string[],
 *   risk: 'high'|'medium'|'low'
 * }}
 */
export function parseMedical(text) {
  if (!text || typeof text !== 'string') {
    return { bp_sys: null, bp_dia: null, weight_kg: null, lmp_date: null, symptoms: [], risk: 'low' };
  }

  const t = text.toLowerCase().trim();

  // ── Blood Pressure ─────────────────────────────────────────────────────────
  // Patterns: "bp 150 by 90" | "150/90" | "pressure 120 over 80" | "150 se 90"
  // | "bp 150-90" | "bp systolic 150 diastolic 90"
  let bp_sys = null;
  let bp_dia = null;

  const bpPatterns = [
    // "bp 150 by 90" / "bp 150 over 90" / "bp 150 se 90"
    /(?:bp|blood\s*pressure|pressure)\s*[:\s]*(\d{2,3})\s*(?:by|\/|over|se|-)\s*(\d{2,3})/i,
    // "150/90" or "150-90" standalone
    /\b(\d{2,3})\s*[\/\-]\s*(\d{2,3})\b/,
    // "systolic 150 diastolic 90"
    /systolic\s*[:\s]*(\d{2,3}).*?diastolic\s*[:\s]*(\d{2,3})/i,
    // single "bp 150" — systolic only
    /(?:bp|blood\s*pressure|pressure)\s*[:\s]*(\d{2,3})/i,
  ];

  for (const re of bpPatterns) {
    const m = t.match(re);
    if (m) {
      bp_sys = parseInt(m[1]);
      bp_dia = m[2] ? parseInt(m[2]) : null;
      break;
    }
  }

  // ── Weight ─────────────────────────────────────────────────────────────────
  // "vajan 54" / "54 kilo" / "weight 62.5 kg" / "58.5 kilogram"
  let weight_kg = null;
  const weightPatterns = [
    /(?:vajan|weight|wt|bhar)\s*[:\s]*(\d{2,3}(?:\.\d)?)/i,
    /(\d{2,3}(?:\.\d)?)\s*(?:kilo(?:gram)?|kg)\b/i,
  ];
  for (const re of weightPatterns) {
    const m = t.match(re);
    if (m) { weight_kg = parseFloat(m[1]); break; }
  }

  // ── LMP (Last Menstrual Period) ────────────────────────────────────────────
  // "LMP 5 march" / "lmp 12 jan 2026" / "pichla mahavari 3 april"
  let lmp_date = null;
  const lmpPatterns = [
    /(?:lmp|last\s*period|mahavari|pichla\s*mahavari)\s*[:\s]*(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    /(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(?:ko\s*)?(?:lmp|mahavari)/i,
    /(?:lmp|mahavari)\s*[:\s]*(\d{4}-\d{2}-\d{2})/i, // ISO date fallback
  ];
  for (const re of lmpPatterns) {
    const m = t.match(re);
    if (m) {
      if (m[0].includes('-') && m[1].length === 4) {
        lmp_date = m[1]; // already ISO
      } else {
        const day = m[1].padStart(2, '0');
        const month = monthToNum(m[2]);
        const year = new Date().getFullYear();
        lmp_date = `${year}-${month}-${day}`;
      }
      break;
    }
  }

  // ── Symptoms ───────────────────────────────────────────────────────────────
  const symptoms = SYMPTOM_PATTERNS
    .filter(({ re }) => re.test(t))
    .map(({ key }) => key);

  // ── Risk calculation ───────────────────────────────────────────────────────
  const risk = calcRisk(bp_sys, bp_dia, symptoms);

  return { bp_sys, bp_dia, weight_kg, lmp_date, symptoms, risk };
}

/**
 * calcRisk(bp_sys, bp_dia, symptoms)
 * Mirrors the logic in VisitForm so risk is consistent.
 */
export function calcRisk(bp_sys, bp_dia, symptoms = []) {
  if ((bp_sys && bp_sys >= 140) || (bp_dia && bp_dia >= 90)) return 'high';
  if (symptoms.includes('bleeding') || symptoms.includes('edema')) return 'high';
  if ((bp_sys && bp_sys >= 130) || (bp_dia && bp_dia >= 85)) return 'medium';
  if (symptoms.includes('headache') || symptoms.includes('fever')) return 'medium';
  return 'low';
}
