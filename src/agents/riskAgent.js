/**
 * riskAgent.js — MoHFW ANC Clinical Triage Engine
 *
 * Based on Ministry of Health & Family Welfare Antenatal Care guidelines.
 * Runs fully on-device. No server call. < 1ms execution.
 *
 * Input: parsed vitals from nerAgent.parseMedical()
 * Output: { level, reasons[], protocol, urgency }
 */

/**
 * triageRisk({ bp_sys, bp_dia, weight_kg, symptoms, age, pregnancyWeek })
 *
 * @param {object} params
 * @param {number|null} params.bp_sys        — systolic BP (mmHg)
 * @param {number|null} params.bp_dia        — diastolic BP (mmHg)
 * @param {number|null} params.weight_kg     — body weight (kg)
 * @param {string[]}    params.symptoms      — from nerAgent: ['edema','fever',...]
 * @param {number|null} params.age           — patient age in years
 * @param {number|null} params.pregnancyWeek — gestational age in weeks
 *
 * @returns {{
 *   level:    'high' | 'medium' | 'low',
 *   reasons:  string[],
 *   protocol: string,
 *   urgency:  'immediate' | 'same-day' | 'routine'
 * }}
 */
export function triageRisk({
  bp_sys       = null,
  bp_dia       = null,
  weight_kg    = null,
  symptoms     = [],
  age          = null,
  pregnancyWeek = null,
} = {}) {
  const reasons = [];
  let level = 'low';

  // ── HIGH risk rules (MoHFW ANC guidelines) ──────────────────────────────

  // 1. Hypertension in pregnancy (PIH / Pre-eclampsia threshold)
  if ((bp_sys !== null && bp_sys >= 140) || (bp_dia !== null && bp_dia >= 90)) {
    level = 'high';
    reasons.push('High BP (≥140/90)');
  }

  // 2. Pre-eclampsia: hypertension + edema
  if (
    symptoms.includes('edema') &&
    bp_sys !== null && bp_sys >= 140
  ) {
    level = 'high';
    reasons.push('Pre-eclampsia risk (BP + edema)');
  }

  // 3. Antepartum haemorrhage
  if (symptoms.includes('bleeding')) {
    level = 'high';
    reasons.push('Bleeding — possible APH');
  }

  // 4. Severe dizziness with high BP → eclampsia watch
  if (symptoms.includes('dizziness') && bp_sys !== null && bp_sys >= 140) {
    level = 'high';
    reasons.push('Dizziness + High BP — eclampsia risk');
  }

  // 5. Headache + High BP → HELLP / eclampsia
  if (symptoms.includes('headache') && bp_sys !== null && bp_sys >= 140) {
    level = 'high';
    reasons.push('Headache + High BP — neurological risk');
  }

  // ── MEDIUM risk rules ────────────────────────────────────────────────────
  // Only downgrade to medium if not already high

  // 6. Borderline BP (Stage 1 hypertension)
  if (
    level !== 'high' &&
    ((bp_sys !== null && bp_sys >= 130) || (bp_dia !== null && bp_dia >= 85))
  ) {
    level = 'medium';
    reasons.push('Borderline BP (130–139/85–89)');
  }

  // 7. Low maternal weight (malnutrition risk)
  if (level !== 'high' && weight_kg !== null && weight_kg < 40) {
    level = 'medium';
    reasons.push('Low weight (<40 kg) — malnutrition risk');
  }

  // 8. Age-related risk (adolescent or advanced maternal age)
  if (level !== 'high' && age !== null && (age < 18 || age > 35)) {
    level = 'medium';
    reasons.push(age < 18 ? 'Adolescent pregnancy (<18)' : 'Advanced maternal age (>35)');
  }

  // 9. Fever in third trimester
  if (level !== 'high' && symptoms.includes('fever')) {
    level = 'medium';
    reasons.push('Fever — infection risk');
  }

  // 10. Generalised edema without high BP
  if (level !== 'high' && symptoms.includes('edema')) {
    level = 'medium';
    reasons.push('Edema — monitor for PIH');
  }

  // 11. Late gestational age (≥36 weeks) with any symptom
  if (
    level !== 'high' &&
    pregnancyWeek !== null && pregnancyWeek >= 36 &&
    symptoms.length > 0
  ) {
    level = 'medium';
    reasons.push('Near-term (≥36 wks) with symptoms');
  }

  // ── Protocol + urgency mapping ───────────────────────────────────────────
  const PROTOCOLS = {
    high:   'Refer PHC today',
    medium: 'Monitor — revisit within 3 days',
    low:    'Continue ANC as scheduled',
  };

  const URGENCY = {
    high:   'immediate',
    medium: 'same-day',
    low:    'routine',
  };

  // Default reason when nothing triggered
  if (reasons.length === 0) {
    reasons.push('Vitals within normal range');
  }

  return {
    level,
    reasons,
    protocol: PROTOCOLS[level],
    urgency:  URGENCY[level],
  };
}
