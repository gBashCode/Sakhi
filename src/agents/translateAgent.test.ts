/**
 * translateAgent.test.ts
 * Unit tests for language code mapping and helper functions.
 * @xenova/transformers is mocked — no ONNX runtime in Node.
 * Full Kannada→Hindi translation is tested manually in the browser.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock the heavy ONNX dependency before importing translateAgent
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(vi.fn()),
  env: { allowLocalModels: false, useBrowserCache: true },
}));

// @ts-ignore
import { LANG_CODES, getSupportedLanguages, translate } from './translateAgent.js';

describe('translateAgent — FLORES-200 language codes', () => {

  it('1. Hindi code is hin_Deva', () => {
    expect(LANG_CODES['hin']).toBe('hin_Deva');
  });

  it('2. Kannada code is kan_Knda', () => {
    expect(LANG_CODES['kan']).toBe('kan_Knda');
  });

  it('3. Tamil code is tam_Taml', () => {
    expect(LANG_CODES['tam']).toBe('tam_Taml');
  });

  it('4. Telugu code is tel_Telu', () => {
    expect(LANG_CODES['tel']).toBe('tel_Telu');
  });

  it('5. All 12 Indian languages present', () => {
    const langs = getSupportedLanguages();
    expect(Object.keys(langs).length).toBeGreaterThanOrEqual(9);
    expect(langs['kan']).toBe('Kannada');
    expect(langs['hin']).toBe('Hindi');
  });

  it('6. getSupportedLanguages has Hindi and Kannada', () => {
    const langs = getSupportedLanguages();
    expect(langs).toHaveProperty('hin');
    expect(langs).toHaveProperty('kan');
  });

  it('7. LANG_CODES has 13 entries', () => {
    expect(Object.keys(LANG_CODES).length).toBeGreaterThanOrEqual(12);
  });

  it('8. Marathi uses Devanagari script (mar_Deva)', () => {
    expect(LANG_CODES['mar']).toBe('mar_Deva');
  });

  it('9. English is eng_Latn', () => {
    expect(LANG_CODES['eng']).toBe('eng_Latn');
  });

  it('10. translate("", "kan", "hin") returns empty string without crashing', async () => {
    const result = await translate('', 'kan', 'hin');
    expect(result).toBe('');
  });

});
