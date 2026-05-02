/**
 * riskAgent.js — MoHFW ANC Clinical Triage Engine
 */

// ── Global Exposure ──────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.triageRisk = triageRisk;
}

export function triageRisk({bp_sys, bp_dia, weight_kg, symptoms = [], age, gestationalAge}) {
  const reasons = [];
  let level = 'low';

  // FIXED: Return low if no data
  if (!bp_sys && !bp_dia && symptoms.length === 0) {
    return {level: 'low', reasons: ['Incomplete data'], protocol: 'Check vitals again', alertColor: 'bg-gray-500'};
  }

  if (bp_sys >= 140 || bp_dia >= 90) {
    level = 'high';
    reasons.push(`High BP: ${bp_sys || '?'}/${bp_dia || '?'}`);
  }
  if (symptoms.includes('edema') && (bp_sys >= 140 || bp_dia >= 90)) {
    level = 'high';
    reasons.push('Pre-eclampsia risk');
  }
  if (symptoms.includes('bleeding')) {
    level = 'high';
    reasons.push('Bleeding in pregnancy');
  }
  if (weight_kg && weight_kg < 40) {
    level = level === 'high'? 'high' : 'medium';
    reasons.push('Low maternal weight');
  }

  const protocol = {
    high: 'Refer to PHC today. Call 108 if needed.',
    medium: 'Monitor closely. ANM visit in 3 days.',
    low: 'Continue routine ANC.'
  };

  return {
    level,
    reasons,
    protocol: protocol[level],
    alertColor: {high: 'bg-red-600', medium: 'bg-yellow-500', low: 'bg-green-500'}[level]
  };
}
