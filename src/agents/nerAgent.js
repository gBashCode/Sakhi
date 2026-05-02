/**
 * nerAgent.js — Simple, robust medical parser for ASHA voice input
 */

// ── Global Exposure ──────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.parseMedical = parseMedical;
}

export function parseMedical(text, contextField = null) {
  if (!text) return { bp_sys: null, bp_dia: null, weight_kg: null, lmp_date: null, symptoms: [], raw_text: "", name: null, age: null };
  
  const t = text.toLowerCase().replace(/hindi|hindi me/g, '').replace(/,/g, ' ');

  // 1. Context-aware parsing (High priority)
  if (contextField) {
    if (contextField === 'name') {
      const name = text.replace(/naam hai|mera naam|patient ka naam|ka naam|hai|ji/gi, '').trim();
      return { name };
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
      if (/sujan|edema|soojan|phool/.test(t)) symptoms.push('edema');
      if (/bukhar|fever|tap/.test(t)) symptoms.push('fever');
      if (/khoon|bleeding|rakt/.test(t)) symptoms.push('bleeding');
      if (/sir.*dard|headache|sirduk/.test(t)) symptoms.push('headache');
      if (/ulti|vomit|matli/.test(t)) symptoms.push('vomiting');
      return { symptoms };
    }
  }

  // 2. General parsing (Fallback)
  const nameMatch = t.match(/naam (?:hai )?(.+?)(?: hai|$)/) || t.match(/(?:hai )?(.+?)(?: naam hai)/);
  const nameValue = nameMatch ? nameMatch[1].trim() : null;

  const ageMatch = t.match(/(\d{1,2})\s*(?:saal|year|umar)/);
  const ageValue = ageMatch ? ageMatch[1] : null;

  const bp = t.match(/bp.*?(\d{2,3})\D+(\d{2,3})/) || t.match(/(\d{2,3})\s+(\d{2,3})/);
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
    name: nameValue,
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
