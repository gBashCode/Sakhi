import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = true;
env.allowRemoteModels = false; // STOP internet download
env.useBrowserCache = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

let hfPipeline = null;
let modelStatus = 'loading'; 

export async function initSTT() {
  if (hfPipeline) return hfPipeline;
  try {
    console.log('Loading Whisper from APK assets...');
    hfPipeline = await pipeline(
      'automatic-speech-recognition',
      '/models/whisper-small.hi', 
      {
        quantized: true,
        progress_callback: (p) => console.log('Model loading:', p)
      }
    );
    modelStatus = 'ready';
    return hfPipeline;
  } catch (e) {
    modelStatus = 'error';
    console.error('Failed to load bundled model:', e);
    return null;
  }
}

// Start loading background model
if (typeof window !== 'undefined') {
  initSTT();
}

export function getModelStatus() { return modelStatus; }
export function isModelReady() { return modelStatus === 'ready'; }
export function stopListening() { /* native auto-stops */ }

export async function transcribeOffline(audioBlob) {
  const stt = await initSTT();
  if (!stt) throw new Error('AI model not found in app. Reinstall APK.');

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

// ── FEATURE 1: Primary Android Native, Fallback HF ─────────────────────────
export async function transcribeRegional(language = 'hi-IN') {
  return new Promise(async (resolve, reject) => {
    // 1. Primary: Try Android Native STT First
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      console.log("Using Android Native STT...");
      const rec = new SpeechRecognition();
      rec.lang = language;
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = e => {
        resolve(e.results[0][0].transcript);
      };
      rec.onerror = async e => {
        console.warn("Native STT error:", e.error, "- falling back to offline Whisper");
        resolve(await runFallback(language));
      };
      try {
        rec.start();
        return;
      } catch (e) {
         console.warn("Native STT start failed - falling back to offline Whisper");
         resolve(await runFallback(language));
         return;
      }
    } else {
      console.log("Native STT not supported, using offline Whisper");
      resolve(await runFallback(language));
    }
  });
}

// Helper to record 8 seconds and pass to offline Whisper
async function runFallback(language) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    return new Promise((resolve) => {
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        try {
          const text = await transcribeOffline(audioBlob);
          resolve(text);
        } catch(err) {
          console.error("Offline whisper failed:", err);
          // 3. Fallback to server if all offline fails
          if (navigator.onLine) {
             const formData = new FormData();
             formData.append('file', audioBlob, 'audio.webm');
             const res = await fetch('https://sakhi-api.onrender.com/api/transcribe', {
               method: 'POST', body: formData
             });
             const data = await res.json();
             resolve(data.text);
          } else {
             resolve("");
          }
        }
      };
      mediaRecorder.start();
      setTimeout(() => { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 8000);
    });
  } catch (e) {
    console.error("Mic error:", e);
    return "";
  }
}
