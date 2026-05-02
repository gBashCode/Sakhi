/**
 * sttAgent.js — On-device Speech-to-Text using Whisper (tiny.hi)
 *
 * Uses @xenova/transformers running entirely in the browser via ONNX Runtime.
 * The 40MB model is downloaded on first use and cached by the browser —
 * subsequent loads (including airplane mode) work fully offline.
 *
 * Model: Xenova/whisper-tiny — multilingual, works well for Hindi + English.
 * Target device: Redmi 9A (2GB RAM). Inference ~5–8s for a 5s clip.
 */
import { pipeline, env } from '@xenova/transformers';

// Allow browser-side caching of the ONNX model weights
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton — load once, reuse across all calls
let _model = null;
let _loading = false;
let _loadPromise = null;

/**
 * initSTT()
 * Loads Whisper tiny (multilingual) if not already loaded.
 * Returns the pipeline instance.
 * Safe to call concurrently — only one fetch in flight.
 */
export async function initSTT() {
  if (_model) return _model;
  if (_loading) return _loadPromise;

  _loading = true;
  _loadPromise = pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-tiny',            // 41MB, multilingual (Hindi + English)
  ).then((p) => {
    _model = p;
    _loading = false;
    console.log('[sttAgent] Whisper tiny loaded and cached');
    return _model;
  }).catch((err) => {
    _loading = false;
    _loadPromise = null;
    throw err;
  });

  return _loadPromise;
}

/**
 * transcribeOnDevice(blob)
 * @param {Blob} blob — audio/webm blob from MediaRecorder
 * @returns {Promise<string>} — e.g. "BP 150 by 90 vajan 54 kilo"
 *
 * Works fully offline after first load.
 * language: 'hindi' → model uses multilingual Hindi weights
 * task: 'transcribe' → preserves original language (not translate to English)
 */
export async function transcribeOnDevice(blob) {
  const stt = await initSTT();

  // Convert Blob → object URL for the pipeline
  const url = URL.createObjectURL(blob);
  try {
    const out = await stt(url, {
      language: 'hindi',
      task: 'transcribe',
      // chunk_length_s keeps memory low on Redmi 9A
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    return (out.text ?? '').trim();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * warmUpSTT()
 * Call this on app load to pre-fetch the model so the first mic use is instant.
 * Fire-and-forget — errors are swallowed.
 */
export function warmUpSTT() {
  initSTT().catch((err) =>
    console.warn('[sttAgent] Warm-up failed (offline first load?):', err)
  );
}
