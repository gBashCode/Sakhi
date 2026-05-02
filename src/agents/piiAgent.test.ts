/**
 * piiAgent.test.ts — Regression tests for PII masking
 */
import { describe, it, expect } from 'vitest';
// @ts-ignore
import { maskPII, hash, maskPayload } from './piiAgent.js';

const rawVisit = {
  clientId:    'abc-123',
  patientId:   'pat-456',
  patientName: 'Sunita Devi',
  phone:       '9876543210',
  aadhaarLast4:'1234',
  address:     '12 Gandhi Nagar, Tumkur',
  age:         23,
  lmp_date:    '2026-03-15',
  bpSys:       140,
  bpDia:       90,
  weight:      52,
  symptoms:    'edema',
  riskLevel:   'high',
  synced:      0,
};

describe('maskPII — DPDP Act compliance', () => {

  it('1. patientName removed', () => {
    const clean = maskPII(rawVisit);
    expect(clean).not.toHaveProperty('patientName');
  });

  it('2. phone removed', () => {
    const clean = maskPII(rawVisit);
    expect(clean).not.toHaveProperty('phone');
  });

  it('3. aadhaarLast4 removed', () => {
    const clean = maskPII(rawVisit);
    expect(clean).not.toHaveProperty('aadhaarLast4');
  });

  it('4. address removed', () => {
    const clean = maskPII(rawVisit);
    expect(clean).not.toHaveProperty('address');
  });

  it('5. patientId pseudonymised (not original value)', () => {
    const clean = maskPII(rawVisit);
    expect(clean.patientId).not.toBe('pat-456');
    expect(clean.patientId).toHaveLength(8);
  });

  it('6. hash is deterministic (same input → same output)', () => {
    expect(hash('pat-456')).toBe(hash('pat-456'));
  });

  it('7. lmp_date truncated to month-year only', () => {
    const clean = maskPII(rawVisit);
    expect(clean.lmp_date).toBe('2026-03');
  });

  it('8. age generalised to 5-year band', () => {
    const clean = maskPII(rawVisit);
    expect(clean.age).toBe('20-24');
  });

  it('9. clinical fields retained (bp, weight, symptoms, risk)', () => {
    const clean = maskPII(rawVisit);
    expect(clean.bpSys).toBe(140);
    expect(clean.bpDia).toBe(90);
    expect(clean.weight).toBe(52);
    expect(clean.symptoms).toBe('edema');
    expect(clean.riskLevel).toBe('high');
  });

  it('10. original visit object is NOT mutated', () => {
    maskPII(rawVisit);
    expect(rawVisit.patientName).toBe('Sunita Devi');
    expect(rawVisit.phone).toBe('9876543210');
    expect(rawVisit.patientId).toBe('pat-456');
  });

  it('11. maskPayload handles array', () => {
    const result = maskPayload([rawVisit, rawVisit]);
    expect(result).toHaveLength(2);
    result.forEach((r: any) => expect(r).not.toHaveProperty('patientName'));
  });

  it('12. maskPII(null) returns {}', () => {
    expect(maskPII(null)).toEqual({});
  });

});
