import { pipeline, env } from '@xenova/transformers';

// CRITICAL: Disable remote download. Force local APK files.
env.allowLocalModels = true;
env.allowRemoteModels = false; // STOP internet download
env.useBrowserCache = false; // Don't use cache, use APK files
env.backends.onnx.wasm.numThreads = 1; // FIX: 2GB phones crash with 4
env.backends.onnx.wasm.proxy = false;

let transcriber = null;
let modelStatus = 'loading'; // 'loading' | 'ready' | 'error'

export async function initSTT() {
  if (transcriber) return transcriber;

  try {
    console.log('Loading Whisper from APK assets...');
    modelStatus = 'loading';

    // FIX: Load from bundled /models/ folder in APK
    transcriber = await pipeline(
      'automatic-speech-recognition',
      '/models/whisper-small.hi', // Local path in APK
      {
        quantized: true,
        progress_callback: (p) => console.log('Model loading:', p)
      }
    );

    modelStatus = 'ready';
    console.log('Whisper ready from APK ✅');
  } catch (e) {
    modelStatus = 'error';
    console.error('Failed to load bundled model:', e);
    transcriber = null;
  }
  return transcriber;
}

// Start loading when app opens
if (typeof window !== 'undefined') {
  initSTT();
}

export async function transcribeOffline(audioBlob) {
  const stt = await initSTT();
  if (!stt) throw new Error('AI model not found in app. Reinstall APK.');

  // Assuming audioBlob is a WebM/WAV, we need to decode it to Float32Array
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const audioData = audioBuffer.getChannelData(0);

  const output = await stt(audioData, {
    language: 'hindi',
    task: 'transcribe',
    chunk_length_s: 15,
    stride_length_s: 3,
    return_timestamps: false,
  });
  return output.text.trim();
}

export function getModelStatus() { return modelStatus; }

export function isModelReady() { return modelStatus === 'ready'; }

export function stopListening() {
  // Not strictly needed for the offline pipeline logic with MediaRecorder
}

// 🔄 PART 3: FRONTEND FALLBACK TO BACKEND
const API_URL = 'https://sakhi-api.up.railway.app';

export async function transcribeWithFallback(audioBlob) {
  // 1. Try offline first
  try {
    if (getModelStatus() === 'ready') {
      return await transcribeOffline(audioBlob);
    }
  } catch (e) {
    console.log('Offline AI failed, trying server...');
  }

  // 2. Fallback to server if online
  if (navigator.onLine) {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const res = await fetch(`${API_URL}/api/transcribe`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.text;
    } catch (e) {
      throw new Error('Server bhi fail. Internet check karo.');
    }
  }

  throw new Error('Offline AI not ready aur internet nahi hai');
}

export async function transcribeRegional(audioBlob, lang) {
  // Backwards compatibility if called directly
  return await transcribeWithFallback(audioBlob);
}
