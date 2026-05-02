/**
 * nerAgent.test.ts — 10 sentence regression test for parseMedical()
 *
 * Run: npm test  (or: npx vitest run)
 * All 10 must pass. Zero server calls.
 */
import { describe, it, expect } from 'vitest';
// @ts-ignore — JS agent, no types needed
import { parseMedical } from './nerAgent.js';

describe('parseMedical — 10 sentence regression', () => {

  // 1. Classic Hindi mix: BP + weight + edema
  it('1. "BP 150 by 90, vajan 54, pair me sujan"', () => {
    const r = parseMedical('BP 150 by 90, vajan 54, pair me sujan');
    expect(r.bp_sys).toBe(150);
    expect(r.bp_dia).toBe(90);
    expect(r.weight_kg).toBe(54);
    expect(r.symptoms).toContain('edema');
    expect(r.risk).toBe('high');
  });

  // 2. Slash format BP only
  it('2. "BP 140/90"', () => {
    const r = parseMedical('BP 140/90');
    expect(r.bp_sys).toBe(140);
    expect(r.bp_dia).toBe(90);
    expect(r.risk).toBe('high');
  });

  // 3. Weight in kilo + Hindi fever
  it('3. "vajan 58 kilo, bukhar hai"', () => {
    const r = parseMedical('vajan 58 kilo, bukhar hai');
    expect(r.weight_kg).toBe(58);
    expect(r.symptoms).toContain('fever');
    expect(r.bp_sys).toBeNull();
  });

  // 4. "over" separator + English weight
  it('4. "pressure 120 over 80, weight 55 kg"', () => {
    const r = parseMedical('pressure 120 over 80, weight 55 kg');
    expect(r.bp_sys).toBe(120);
    expect(r.bp_dia).toBe(80);
    expect(r.weight_kg).toBe(55);
    expect(r.risk).toBe('low');
  });

  // 5. Hindi bleeding only
  it('5. "khoon aa raha hai"', () => {
    const r = parseMedical('khoon aa raha hai');
    expect(r.symptoms).toContain('bleeding');
    expect(r.risk).toBe('high');
  });

  // 6. LMP with month name
  it('6. "LMP 5 march, vajan 62 kilo"', () => {
    const r = parseMedical('LMP 5 march, vajan 62 kilo');
    expect(r.lmp_date).toBe('2026-03-05');
    expect(r.weight_kg).toBe(62);
  });

  // 7. Decimal weight + "se" separator BP
  it('7. "BP 160 se 100, vajan 62.5 kilo"', () => {
    const r = parseMedical('BP 160 se 100, vajan 62.5 kilo');
    expect(r.bp_sys).toBe(160);
    expect(r.bp_dia).toBe(100);
    expect(r.weight_kg).toBe(62.5);
    expect(r.risk).toBe('high');
  });

  // 8. Full Hindi sentence + edema
  it('8. "mera BP 130 by 85 hai aur pair me sujan hai"', () => {
    const r = parseMedical('mera BP 130 by 85 hai aur pair me sujan hai');
    expect(r.bp_sys).toBe(130);
    expect(r.bp_dia).toBe(85);
    expect(r.symptoms).toContain('edema');
    expect(r.risk).toBe('high'); // edema overrides medium BP
  });

  // 9. English symptoms + weight
  it('9. "weight 55 kg, fever and edema"', () => {
    const r = parseMedical('weight 55 kg, fever and edema');
    expect(r.weight_kg).toBe(55);
    expect(r.symptoms).toContain('fever');
    expect(r.symptoms).toContain('edema');
    expect(r.risk).toBe('high');
  });

  // 10. LMP in January + bleeding
  it('10. "LMP 12 jan, bleeding ho rahi hai"', () => {
    const r = parseMedical('LMP 12 jan, bleeding ho rahi hai');
    expect(r.lmp_date).toBe('2026-01-12');
    expect(r.symptoms).toContain('bleeding');
    expect(r.risk).toBe('high');
  });

});
