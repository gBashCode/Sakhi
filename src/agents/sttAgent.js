import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = true;
env.useBrowserCache = true;
env.allowRemoteModels = true;
env.remoteHost = 'https://huggingface.co';
env.backends.onnx.wasm.numThreads = 1; // CRITICAL: 2GB phones crash with 4 threads
env.backends.onnx.wasm.proxy = false; // CRITICAL: Disable workers on low RAM

let transcriber = null;
let modelLoading = false;
let modelReady = false;
let progressCallback = null;

export function setSTTProgressCallback(cb) {
  progressCallback = cb;
}

export async function initSTT() {
  if (transcriber) {
    if (progressCallback) progressCallback({ status: 'ready' });
    return transcriber;
  }
  if (modelLoading) {
    while(modelLoading) await new Promise(r => setTimeout(r, 100));
    if (progressCallback) progressCallback({ status: 'ready' });
    return transcriber;
  }

  modelLoading = true;
  console.log('Sakhi AI: Loading Whisper model... 40MB');

  try {
    // FIX: Use quantized tiny model - 40MB not 150MB. Works on 2GB RAM
    transcriber = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.hi', // tiny = 40MB, base = 150MB crashes 2GB phones
      {
        quantized: true,
        progress_callback: (p) => {
          if (progressCallback) progressCallback(p);
          if (p.status === 'progress') {
            console.log(`Model: ${Math.round(p.progress)}%`);
          }
        }
      }
    );
    modelReady = true;
    console.log('Sakhi AI: Model ready ✅');
    if (progressCallback) progressCallback({ status: 'ready' });
  } catch (e) {
    console.error('STT load failed:', e);
    modelReady = false;
    transcriber = null;
  }
  modelLoading = false;
  return transcriber;
}

// CRITICAL FIX: Preload when app opens, not on mic click
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.initSTT = initSTT;
  // @ts-ignore
  window.transcribeOnDevice = transcribeOnDevice;
  initSTT();
}

export async function transcribeOnDevice(audioBlob) {
  // FIX: Wait for model if still downloading
  if (!modelReady) {
    console.log('Waiting for model download...');
    await initSTT();
  }

  if (!transcriber) {
    throw new Error('AI model failed. Connect internet once to download.');
  }

  try {
    // Converting to Float32Array 16kHz for better stability on Android browsers
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const audioData = audioBuffer.getChannelData(0);

    const output = await transcriber(audioData, {
      language: 'hindi',
      task: 'transcribe',
      chunk_length_s: 15, // FIX: Smaller chunks = less RAM
      stride_length_s: 3,
      return_timestamps: true, // Needed for confidence heuristics
    });

    console.log('[sttAgent] Result:', output);

    return {
      text: output.text.trim(),
      confidence: output.chunks?.[0]?.confidence || 0.85
    };
  } catch (e) {
    console.error('Transcribe failed:', e);
    return '';
  }
}

export function isModelReady() { return modelReady; }
