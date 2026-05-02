/**
 * nerAgent.js — Simple, robust medical parser for ASHA voice input
 */

// ── Global Exposure ──────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.parseMedical = parseMedical;
}

export function parseMedical(text) {
  if (!text) return { bp_sys: null, bp_dia: null, weight_kg: null, lmp_date: null, symptoms: [], raw_text: "" };
  
  const t = text.toLowerCase().replace(/hindi|hindi me/g, '').replace(/,/g, ' ');

  // FIXED: Handles "150 90", "150 by 90", "150/90", "150-90"
  const bp = t.match(/bp.*?(\d{2,3})\D+(\d{2,3})/) || t.match(/(\d{2,3})\s+(\d{2,3})/);

  // FIXED: Handles "vajan 54", "54 kg", "54 kilo"
  const weight = t.match(/(vajan|weight|kg|kilo).*?(\d+\.?\d*)|(\d+\.?\d*)\s*(kg|kilo)/);

  const lmp = t.match(/(lmp|last period|mahwari).*?(\d{1,2}).*?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);

  const symptoms = [];
  if (/sujan|edema|soojan|phool/.test(t)) symptoms.push('edema');
  if (/bukhar|fever|tap/.test(t)) symptoms.push('fever');
  if (/khoon|bleeding|rakt/.test(t)) symptoms.push('bleeding');
  if (/sir.*dard|headache|sirduk/.test(t)) symptoms.push('headache');
  if (/ulti|vomit|matli/.test(t)) symptoms.push('vomiting');

  const monthMap = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};

  return {
    bp_sys: bp? parseInt(bp[1]) : null,
    bp_dia: bp? parseInt(bp[2]) : null,
    weight_kg: weight? parseFloat(weight[2] || weight[3]) : null,
    lmp_date: lmp? `2026-${monthMap[lmp[3]]}-${lmp[2].padStart(2,'0')}` : null,
    symptoms,
    raw_text: text
  };
}

// Mocking calcRisk for backward compatibility if needed elsewhere
export function calcRisk(bp_sys, bp_dia, symptoms = []) {
  if (bp_sys >= 140 || bp_dia >= 90) return 'high';
  if (symptoms.includes('bleeding') || symptoms.includes('edema')) return 'high';
  return 'low';
}
