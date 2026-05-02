/**
 * drugAgent.test.ts — Regression tests for checkDueMeds()
 * DONE WHEN: Patient at 16 weeks shows IFA + TT1 badges
 */
import { describe, it, expect } from 'vitest';
// @ts-ignore
import { checkDueMeds } from './drugAgent.js';

// Helpers: LMP n weeks ago
const lmpWksAgo = (n: number) =>
  new Date(Date.now() - n * 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

describe('checkDueMeds — MoHFW ANC drug protocol', () => {

  // ── KEY TEST: 16-week patient shows IFA + TT1 ───────────────────────────
  it('1. 16wk patient shows IFA + TT1 badges', () => {
    const meds = checkDueMeds({
      lmp_date: lmpWksAgo(16),
      ifaStarted: false, tt1Done: false,
    });
    const drugs = meds.map((m: any) => m.drug);
    expect(drugs).toContain('IFA');
    expect(drugs).toContain('TT1');
    expect(drugs).toContain('Albend'); // also due at 16wks
  });

  // ── IFA boundary tests ───────────────────────────────────────────────────
  it('2. 13wk patient — IFA NOT due yet', () => {
    const meds = checkDueMeds({ lmp_date: lmpWksAgo(13), ifaStarted: false });
    expect(meds.find((m: any) => m.drug === 'IFA')).toBeUndefined();
  });

  it('3. 14wk patient — IFA due', () => {
    const meds = checkDueMeds({ lmp_date: lmpWksAgo(14), ifaStarted: false });
    expect(meds.find((m: any) => m.drug === 'IFA')).toBeDefined();
  });

  it('4. IFA already started → no IFA badge', () => {
    const meds = checkDueMeds({ lmp_date: lmpWksAgo(16), ifaStarted: true, tt1Done: true });
    expect(meds.find((m: any) => m.drug === 'IFA')).toBeUndefined();
  });

  // ── TT tests ─────────────────────────────────────────────────────────────
  it('5. 15wk — TT1 NOT due yet', () => {
    const meds = checkDueMeds({ lmp_date: lmpWksAgo(15), tt1Done: false });
    expect(meds.find((m: any) => m.drug === 'TT1')).toBeUndefined();
  });

  it('6. TT1 done, 20wk → TT2 due', () => {
    const meds = checkDueMeds({
      lmp_date: lmpWksAgo(20),
      ifaStarted: true, tt1Done: true, tt2Done: false,
    });
    expect(meds.find((m: any) => m.drug === 'TT2')).toBeDefined();
  });

  // ── Calcium tests ─────────────────────────────────────────────────────────
  it('7. 20wk — Calcium due', () => {
    const meds = checkDueMeds({
      lmp_date: lmpWksAgo(20),
      ifaStarted: true, tt1Done: true, calciumStarted: false,
    });
    expect(meds.find((m: any) => m.drug === 'Ca²⁺')).toBeDefined();
  });

  it('8. Calcium already started → no Ca badge', () => {
    const meds = checkDueMeds({
      lmp_date: lmpWksAgo(22),
      ifaStarted: true, tt1Done: true, calciumStarted: true,
    });
    expect(meds.find((m: any) => m.drug === 'Ca²⁺')).toBeUndefined();
  });

  // ── Urgency flag tests ────────────────────────────────────────────────────
  it('9. IFA at 22wks (overdue) → urgency = overdue', () => {
    const meds = checkDueMeds({ lmp_date: lmpWksAgo(22), ifaStarted: false });
    const ifa  = meds.find((m: any) => m.drug === 'IFA') as any;
    expect(ifa?.urgency).toBe('overdue');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  it('10. null patient → empty array, no crash', () => {
    expect(checkDueMeds(null)).toEqual([]);
  });

});
