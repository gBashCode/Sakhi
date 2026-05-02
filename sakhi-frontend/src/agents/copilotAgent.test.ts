/**
 * copilotAgent.test.ts — Regression tests for getNextAction()
 */
import { describe, it, expect } from 'vitest';
// @ts-ignore
import { getNextAction, getGestationalAge, daysSince } from './copilotAgent.js';

const highRisk  = { level: 'high',   reasons: ['High BP'], protocol: 'Refer PHC today' };
const medRisk   = { level: 'medium', reasons: ['Borderline BP'], protocol: 'Monitor' };
const lowRisk   = { level: 'low',    reasons: ['Normal'],  protocol: 'Continue ANC' };

// LMP 20 weeks ago
const lmp20wks  = new Date(Date.now() - 20 * 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
// LMP 10 weeks ago (< 12 wks, no IFA yet needed)
const lmp10wks  = new Date(Date.now() - 10 * 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

const visitBase = { ifaGiven: false, ttDone: false, deviceTs: Date.now() };
const visitOld  = { ifaGiven: false, ttDone: false, deviceTs: Date.now() - 35 * 86400000 };

describe('getNextAction — CalmOps copilot', () => {

  it('1. High risk → Turant PHC le jao (offline works)', () => {
    const action = getNextAction({ lmp_date: lmp20wks }, visitBase, highRisk);
    expect(action).toContain('Turant PHC le jao');
    expect(action).toContain('108');
  });

  it('2. Medium risk, 20wk pregnancy, no IFA → IFA action', () => {
    const action = getNextAction({ lmp_date: lmp20wks }, visitBase, medRisk);
    expect(action).toContain('IFA');
  });

  it('3. Low risk, 20wk pregnancy, IFA done, no TT → TT action', () => {
    const action = getNextAction({ lmp_date: lmp20wks }, { ...visitBase, ifaGiven: true }, lowRisk);
    expect(action).toContain('TT');
  });

  it('4. Low risk, IFA+TT done, visit 35 days ago → ANC overdue', () => {
    const action = getNextAction({ lmp_date: lmp20wks }, { ...visitOld, ifaGiven: true, ttDone: true }, lowRisk);
    expect(action).toContain('ANC visit due');
  });

  it('5. All normal (IFA+TT done, recent visit) → Sab normal hai', () => {
    const action = getNextAction({ lmp_date: lmp10wks }, { ...visitBase, ifaGiven: true, ttDone: true }, lowRisk);
    expect(action).toContain('Sab normal hai');
  });

  it('6. Early pregnancy (10wk) → no IFA yet, Sab normal hai', () => {
    const action = getNextAction({ lmp_date: lmp10wks }, visitBase, lowRisk);
    expect(action).toContain('Sab normal hai');
  });

  it('7. getGestationalAge returns weeks correctly', () => {
    const ga = getGestationalAge(lmp20wks);
    expect(ga).toBeGreaterThanOrEqual(19);
    expect(ga).toBeLessThanOrEqual(21);
  });

  it('8. daysSince returns null for null input', () => {
    expect(daysSince(null)).toBeNull();
  });

  it('9. lmp via patient.lmp (alternate field name) → still works', () => {
    const action = getNextAction({ lmp: lmp20wks }, visitBase, highRisk);
    expect(action).toContain('Turant PHC le jao');
  });

  it('10. Missing patient/visit → graceful, no crash', () => {
    expect(() => getNextAction(null, null, lowRisk)).not.toThrow();
  });

});
