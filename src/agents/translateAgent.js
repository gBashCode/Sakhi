/**
 * translateAgent.js — On-device Indian language translation via NLLB-200
 *
 * Uses Xenova/nllb-200-distilled-600M running entirely in-browser (ONNX).
 * Covers 200 languages including all major Indian languages.
 * Model: ~1.2GB — downloaded once, cached in browser Cache API.
 * After first load: works fully offline (airplane mode).
 *
 * FLORES-200 language codes for Indian languages:
 *   Kannada  → kan_Knda     Hindi    → hin_Deva
 *   Tamil    → tam_Taml     Bengali  → ben_Beng
 *   Telugu   → tel_Telu     Marathi  → mar_Deva
 *   Gujarati → guj_Gujr     Punjabi  → pan_Guru
 *   Odia     → ory_Orya     English  → eng_Latn
 *   Urdu     → urd_Arab     Assamese → asm_Beng
 */
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache  = true;

// ── FLORES-200 language code map ─────────────────────────────────────────────
// Short alias → FLORES-200 code (for developer convenience)
export const LANG_CODES = {
  // Indian languages
  hin: 'hin_Deva',   // Hindi
  kan: 'kan_Knda',   // Kannada
  tam: 'tam_Taml',   // Tamil
  tel: 'tel_Telu',   // Telugu
  mar: 'mar_Deva',   // Marathi
  ben: 'ben_Beng',   // Bengali
  guj: 'guj_Gujr',   // Gujarati
  pan: 'pan_Guru',   // Punjabi (Gurmukhi)
  ory: 'ory_Orya',   // Odia
  urd: 'urd_Arab',   // Urdu
  asm: 'asm_Beng',   // Assamese
  mal: 'mal_Mlym',   // Malayalam
  // International
  eng: 'eng_Latn',   // English
};

function toFlores(code) {
  return LANG_CODES[code] ?? code; // pass-through if already FLORES format
}

// ── Singleton model (loaded once, reused across calls) ────────────────────────
let _model       = null;
let _loading     = false;
let _loadPromise = null;

/**
 * initTranslator()
 * Loads NLLB-200 distilled 600M if not already in memory.
 * Safe to call concurrently — only one fetch in flight.
 * @returns {Promise<pipeline>}
 */
export async function initTranslator() {
  if (_model)   return _model;
  if (_loading) return _loadPromise;

  _loading = true;
  _loadPromise = pipeline(
    'translation',
    'Xenova/nllb-200-distilled-600M',
  ).then((p) => {
    _model   = p;
    _loading = false;
    console.log('[translateAgent] NLLB-200 loaded and cached');
    return _model;
  }).catch((err) => {
    _loading     = false;
    _loadPromise = null;
    throw err;
  });

  return _loadPromise;
}

/**
 * translate(text, srcLang, tgtLang)
 *
 * @param {string} text    — source text (e.g. "ನಗೆ ತಲೆನೋವು ಇದೆ")
 * @param {string} srcLang — source language: 'kan' or full FLORES code 'kan_Knda'
 * @param {string} tgtLang — target language: 'hin' or full FLORES code 'hin_Deva'
 * @returns {Promise<string>} — translated text (e.g. "मुझे सिर दर्द है")
 *
 * Works fully offline after first cache.
 * Typical latency on Redmi 9A: 3–8s for a single sentence.
 */
export async function translate(text, srcLang = 'kan', tgtLang = 'hin') {
  if (!text?.trim()) return '';

  const translator = await initTranslator();
  const src = toFlores(srcLang);
  const tgt = toFlores(tgtLang);

  const result = await translator(text, {
    src_lang:     src,
    tgt_lang:     tgt,
    max_new_tokens: 256,
  });

  return result[0]?.translation_text?.trim() ?? '';
}

/**
 * warmUpTranslator()
 * Pre-fetches the model in the background.
 * Call at app startup — errors are swallowed (first load needs network).
 */
export function warmUpTranslator() {
  initTranslator().catch((err) =>
    console.warn('[translateAgent] Warm-up skipped (offline first load?):', err)
  );
}

/**
 * getSupportedLanguages()
 * Returns the short alias → display name map for the UI language picker.
 */
export function getSupportedLanguages() {
  return {
    hin: 'Hindi',
    kan: 'Kannada',
    tam: 'Tamil',
    tel: 'Telugu',
    mar: 'Marathi',
    ben: 'Bengali',
    guj: 'Gujarati',
    pan: 'Punjabi',
    mal: 'Malayalam',
    eng: 'English',
  };
}
