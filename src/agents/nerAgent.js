export function parseMedical(text) {
  const t = text.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ');

  const name = t.match(/(naam|patient|name|hesaru)\s+([a-zA-Z\u0900-\u097F]{3,})\s*([a-zA-Z\u0900-\u097F]{3,})?/);
  const age = t.match(/(\d{1,3})\s*(saal|years|year|vayassu)/) || t.match(/(age|umar|vayassu)\s*(\d{1,3})/);
  const bp = t.match(/bp.*?(\d{2,3})\D+(\d{2,3})/) || t.match(/(\d{2,3})\s+(\d{2,3})/);
  const weight = t.match(/(vajan|weight|kg|thooka).*?(\d+\.?\d*)/) || t.match(/(\d+\.?\d*)\s*(kg|kilo)/);
  const lmp = t.match(/lmp.*?(\d{1,2}).*?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);

  const symptoms = [];
  if (/sujan|edema|soojan|ootha/.test(t)) symptoms.push('edema');
  if (/bukhar|fever|jwara/.test(t)) symptoms.push('fever');
  if (/khoon|bleeding|raktha/.test(t)) symptoms.push('bleeding');
  if (/sir.*dard|headache|talenovu/.test(t)) symptoms.push('headache');
  if (/ulti|vomit|vaanthi/.test(t)) symptoms.push('vomiting');

  const monthMap = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};

  return {
    patient_name: name? `${name[2] || ''} ${name[3] || ''}`.trim() : null,
    age: age? parseInt(age[1] || age[2]) : null,
    bp_sys: bp? parseInt(bp[1]) : null,
    bp_dia: bp? parseInt(bp[2]) : null,
    weight_kg: weight? parseFloat(weight[2] || weight[1]) : null,
    lmp_date: lmp? `2026-${monthMap[lmp[2]]}-${lmp[1].padStart(2,'0')}` : null,
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
