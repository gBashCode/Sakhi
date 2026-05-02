/**
 * riskAgent.test.ts — Regression tests for triageRisk()
 */
import { describe, it, expect } from 'vitest';
// @ts-ignore
import { triageRisk } from './riskAgent.js';

describe('triageRisk — MoHFW ANC triage', () => {

  it('BP 150 → high + Refer PHC today', () => {
    const r = triageRisk({ bp_sys: 150, bp_dia: 90 });
    expect(r.level).toBe('high');
    expect(r.protocol).toBe('Refer PHC today');
    expect(r.reasons).toContain('High BP (≥140/90)');
    expect(r.urgency).toBe('immediate');
  });

  it('BP 140/90 + edema → pre-eclampsia, high', () => {
    const r = triageRisk({ bp_sys: 140, bp_dia: 90, symptoms: ['edema'] });
    expect(r.level).toBe('high');
    expect(r.reasons.some(s => s.includes('Pre-eclampsia'))).toBe(true);
  });

  it('bleeding → high regardless of BP', () => {
    const r = triageRisk({ bp_sys: 110, bp_dia: 70, symptoms: ['bleeding'] });
    expect(r.level).toBe('high');
    expect(r.reasons.some(s => s.includes('Bleeding'))).toBe(true);
  });

  it('weight 38kg → medium, low weight', () => {
    const r = triageRisk({ bp_sys: 115, bp_dia: 75, weight_kg: 38 });
    expect(r.level).toBe('medium');
    expect(r.reasons.some(s => s.includes('Low weight'))).toBe(true);
  });

  it('age 16 → medium, adolescent pregnancy', () => {
    const r = triageRisk({ age: 16 });
    expect(r.level).toBe('medium');
    expect(r.reasons.some(s => s.includes('Adolescent'))).toBe(true);
  });

  it('normal vitals → low + Continue ANC', () => {
    const r = triageRisk({ bp_sys: 118, bp_dia: 76, weight_kg: 55, age: 24 });
    expect(r.level).toBe('low');
    expect(r.protocol).toBe('Continue ANC as scheduled');
  });

  it('high BP + headache → eclampsia risk, high', () => {
    const r = triageRisk({ bp_sys: 145, symptoms: ['headache'] });
    expect(r.level).toBe('high');
    expect(r.reasons.some(s => s.includes('Headache'))).toBe(true);
  });

  it('borderline BP 133/86 → medium', () => {
    const r = triageRisk({ bp_sys: 133, bp_dia: 86 });
    expect(r.level).toBe('medium');
    expect(r.urgency).toBe('same-day');
  });

});
