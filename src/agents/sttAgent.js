import { pipeline, env } from '@xenova/transformers';

// ── Environment Configuration ──────────────────────────────────────────────
// CRITICAL FIX: Ensure WASM and Models are fetched from remote CDN/Hub
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

// Use CDN for WASM files to ensure they are found and not intercepted by Vite
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';
env.backends.onnx.wasm.numThreads = 1;

// ── Global Exposure ─────────────────────────────────────────
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.initSTT = initSTT;
  // @ts-ignore
  window.transcribeOnDevice = transcribeOnDevice;
}

let transcriber = null;
let modelLoading = false;

export async function initSTT() {
  if (transcriber) return transcriber;
  if (modelLoading) {
    while(modelLoading) await new Promise(r => setTimeout(r, 100));
    return transcriber;
  }
  
  modelLoading = true;
  console.log('[sttAgent] Initializing Whisper model...');
  
  try {
    // Model: Xenova/whisper-tiny (multilingual, 40MB quantized)
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      quantized: true,
    });
    console.log('[sttAgent] Whisper model loaded successfully');
  } catch (e) {
    console.error('[sttAgent] Model load failed:', e);
    transcriber = null;
  } finally {
    modelLoading = false;
  }
  return transcriber;
}

// Background// Preload on app start
if (typeof window !== 'undefined') {
  console.log('[sttAgent] VERSION: 2026-05-02-1512');
  initSTT();
}

export async function transcribeOnDevice(audioBlob) {
  const stt = await initSTT();
  if (!stt) {
    console.error('[sttAgent] Transcriber not available');
    return '';
  }
  
  try {
    const output = await stt(audioBlob, {
      language: 'hindi',
      task: 'transcribe',
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    return output.text.trim();
  } catch (e) {
    console.error('[sttAgent] Transcription failed:', e);
    return '';
  }
}
