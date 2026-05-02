export function triageRisk(vitals) {
  const { bp_sys, bp_dia, symptoms, age } = vitals;
  let level = 'low';
  const flags = [];

  // High Risk Conditions
  if (bp_sys >= 140 || bp_dia >= 90) {
    level = 'high';
    flags.push('hypertension');
    if (symptoms.includes('edema') || symptoms.includes('headache')) {
      flags.push('pre_eclampsia_suspect');
    }
  }
  if (symptoms.includes('bleeding')) {
    level = 'high';
    flags.push('bleeding');
  }
  if (age && (age < 18 || age > 35)) {
    level = level === 'high'? 'high' : 'medium';
    flags.push('age_risk');
  }
  // Medium Risk
  if (bp_sys >= 130 && bp_sys < 140) level = 'medium';

  return { level, flags, action_required: level === 'high' };
}
