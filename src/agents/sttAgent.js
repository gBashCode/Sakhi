import { pipeline, env } from '@xenova/transformers';

// ── Environment Configuration ──────────────────────────────────────────────
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.remoteHost = 'https://huggingface.co';

// CRITICAL: 2GB phones crash with multiple threads or proxy workers
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

// Ensure WASM files are fetched from CDN
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';

let transcriber = null;
let modelLoading = false;
let modelReady = false;
let progressCallback = null;

export function setSTTProgressCallback(cb) {
  progressCallback = cb;
  // If model already ready, trigger it immediately
  if (modelReady && cb) cb({ status: 'ready' });
}

export function isModelReady() { return modelReady; }

export async function initSTT() {
  if (transcriber) {
    if (progressCallback) progressCallback({ status: 'ready' });
    return transcriber;
  }

  if (modelLoading) {
    while(modelLoading) await new Promise(r => setTimeout(r, 100));
    return transcriber;
  }

  modelLoading = true;
  console.log('[sttAgent] Initializing Whisper model... 40MB');

  try {
    // Using whisper-tiny (standard) - 40MB quantized
    transcriber = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny',
      {
        quantized: true,
        progress_callback: (p) => {
          if (progressCallback) progressCallback(p);
          if (p.status === 'progress') {
            console.log(`[sttAgent] Loading: ${Math.round(p.progress)}%`);
          }
        }
      }
    );
    modelReady = true;
    console.log('[sttAgent] Model ready ✅');
    if (progressCallback) progressCallback({ status: 'ready' });
  } catch (e) {
    console.error('[sttAgent] Model load failed:', e);
    modelReady = false;
    transcriber = null;
  }
  modelLoading = false;
  return transcriber;
}

// Global exposure for console testing
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.initSTT = initSTT;
  // @ts-ignore
  window.isModelReady = isModelReady;
}

export async function transcribeOnDevice(audioBlob) {
  if (!modelReady) {
    console.log('[sttAgent] Waiting for model download...');
    await initSTT();
  }

  if (!transcriber) {
    throw new Error('AI model not loaded.');
  }

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const audioData = audioBuffer.getChannelData(0);

    const output = await transcriber(audioData, {
      language: 'hindi',
      task: 'transcribe',
      chunk_length_s: 15,
      stride_length_s: 3,
      return_timestamps: true,
    });

    return {
      text: output.text.trim(),
      confidence: output.chunks?.[0]?.confidence || 0.85
    };
  } catch (e) {
    console.error('[sttAgent] Transcription failed:', e);
    return { text: '', confidence: 0 };
  }
}
