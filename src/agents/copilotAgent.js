export function getNextAction(patient, medical, risk) {
  // Priority 1: Emergency
  if (risk.flags.includes('bleeding')) return 'Turant 108 ko call karo. PHC le jao.';
  if (risk.flags.includes('pre_eclampsia_suspect')) return 'Turant PHC le jao. BP aur sujan khatre ka nishan hai.';
  if (risk.level === 'high') return 'Aaj hi PHC mein checkup karao. BP zyada hai.';

  // Priority 2: Routine care
  if (!patient.ifaGiven) return 'Aaj IFA ki 1 goli dena hai.';
  if (!medical.weight_kg) return 'Vajan check karo aur likho.';

  return 'Sab normal hai. IFA roz dena. 2 hafte baad milna.';
}

export function getGestationalAge(lmp) {
  if (!lmp) return 0;
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const diff = Date.now() - new Date(lmp).getTime();
  return Math.max(0, Math.floor(diff / msPerWeek));
}

export function daysSince(ts) {
  if (!ts) return null;
  const ms = typeof ts === 'number' ? ts : new Date(ts).getTime();
  return Math.floor((Date.now() - ms) / 86400000);
}
