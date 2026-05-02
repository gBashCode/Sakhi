/**
 * nerAgent.js — Simple, robust medical parser for ASHA voice input
 */

// ── Global Exposure ──────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.parseMedical = parseMedical;
}

export function parseMedical(text, contextField = null) {
  if (!text) return { bp_sys: null, bp_dia: null, weight_kg: null, lmp_date: null, symptoms: [], raw_text: "", patient_name: null, age: null };
  
  const t = text.toLowerCase().replace(/hindi|hindi me|english|kannada/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ');

  // 1. Context-aware parsing (High priority)
  if (contextField) {
    if (contextField === 'name') {
      const name = text.replace(/naam hai|mera naam|patient ka naam|ka naam|ka hesaru|hai|ji|hesaru|is my name|name is/gi, '').trim();
      return { patient_name: name };
    }
    if (contextField === 'age') {
      const ageMatch = t.match(/(\d{1,2})/);
      if (ageMatch) return { age: ageMatch[1] };
    }
    if (contextField === 'bp') {
      const bp = t.match(/(\d{2,3})\D+(\d{2,3})/);
      if (bp) return { bp_sys: parseInt(bp[1]), bp_dia: parseInt(bp[2]) };
    }
    if (contextField === 'weight') {
      const weight = t.match(/(\d+\.?\d*)/);
      if (weight) return { weight_kg: parseFloat(weight[1]) };
    }
    if (contextField === 'symptoms') {
      const symptoms = [];
      // Hindi + English + Kannada
      if (/sujan|edema|soojan|phool|swelling|oootha/.test(t)) symptoms.push('edema');
      if (/bukhar|fever|tap|jwara/.test(t)) symptoms.push('fever');
      if (/khoon|bleeding|rakt|rakta/.test(t)) symptoms.push('bleeding');
      if (/sir.*dard|headache|sirduk|tale.*noavu/.test(t)) symptoms.push('headache');
      if (/ulti|vomit|matli|vaman/.test(t)) symptoms.push('vomiting');
      return { symptoms };
    }
  }

  // 2. General parsing (Fallback)

  // FIX: NAME DETECTION - "naam sunita", "sunita devi", "patient sunita"
  const nameMatch = t.match(/(naam|patient|marij|mariij|naam hai|hesaru)\s+([a-zA-Z\u0900-\u097F]{3,})\s*([a-zA-Z\u0900-\u097F]{3,})?/)
            || t.match(/^([a-zA-Z\u0900-\u097F]{3,})\s+([a-zA-Z\u0900-\u097F]{3,})?/) // Name at start
            || t.match(/hesaru (?:ide )?(.+?)(?: ide|$)/);

  const nameValue = nameMatch
    ? (nameMatch[2] ? `${nameMatch[2]} ${nameMatch[3] || ''}`.trim() : (nameMatch[1] ? nameMatch[1].trim() : null))
    : null;

  const ageMatch = t.match(/(\d{1,2})\s*(?:saal|year|umar|vayas)/);
  const ageValue = ageMatch ? ageMatch[1] : null;

  const bp = t.match(/bp.*?(\d{2,3})\D+(\d{2,3})/) || t.match(/(\d{2,3})\s+(\d{2,3})/);
  const weight = t.match(/(vajan|weight|kg|kilo|thoooka).*?(\d+\.?\d*)|(\d+\.?\d*)\s*(kg|kilo)/);
  const lmp = t.match(/(lmp|last period|mahwari).*?(\d{1,2}).*?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);

  const symptoms = [];
  if (/sujan|edema|soojan|phool|swelling|oootha/.test(t)) symptoms.push('edema');
  if (/bukhar|fever|tap|jwara/.test(t)) symptoms.push('fever');
  if (/khoon|bleeding|rakt|rakta/.test(t)) symptoms.push('bleeding');
  if (/sir.*dard|headache|sirduk|tale.*noavu/.test(t)) symptoms.push('headache');
  if (/ulti|vomit|matli|vaman/.test(t)) symptoms.push('vomiting');

  const monthMap = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};

  return {
    patient_name: nameValue,
    age: ageValue,
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
