import { pipeline, env } from '@xenova/transformers';

// Configuration for offline-first operation
env.allowLocalModels = true;
env.allowRemoteModels = typeof navigator !== 'undefined' ? navigator.onLine : true; // Prevent twitching/hanging offline
env.localModelPath = '/models/'; // Explicit local cache path
env.backends.onnx.wasm.numThreads = typeof navigator !== 'undefined' ? Math.max(1, (navigator.hardwareConcurrency || 4) - 1) : 4; // Maximize speed
env.backends.onnx.wasm.wasmPaths = '/wasm/'; // Local WASM files

let hfPipeline = null;
let modelStatus = 'idle'; // idle, loading, ready, error

/**
 * Initialize the Whisper model
 * @param {Function} progressCallback - Callback for download progress
 */
export async function initSTT(progressCallback = null) {
  if (hfPipeline) return hfPipeline;
  
  modelStatus = 'loading';
  try {
    console.log('Initializing Whisper Multilingual Offline Engine...');
    // 'Xenova/whisper-base' is ~140MB and offers a great balance of speed and accuracy for Hindi/Kannada
    hfPipeline = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-base', 
      {
        quantized: true,
        progress_callback: (p) => {
          if (progressCallback && p.status === 'progress') {
            progressCallback(Math.round(p.progress));
          }
          console.log('Model loading status:', p.status, p.progress || '');
        }
      }
    );
    modelStatus = 'ready';
    return hfPipeline;
  } catch (e) {
    modelStatus = 'error';
    console.error('STT Initialization failed:', e);
    throw e;
  }
}

export function getModelStatus() { return modelStatus; }
export function isModelReady() { return modelStatus === 'ready'; }

/**
 * Transcribe using the on-device Whisper model
 */
let globalAudioContext = null;

export async function transcribeOnDevice(audioBlob, language = 'hindi') {
  const stt = await initSTT();
  if (!stt) throw new Error('Offline AI model not ready');

  const arrayBuffer = await audioBlob.arrayBuffer();
  
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  } else if (globalAudioContext.state === 'suspended') {
    await globalAudioContext.resume();
  }

  const audioBuffer = await globalAudioContext.decodeAudioData(arrayBuffer);
  const audioData = audioBuffer.getChannelData(0);

  const output = await stt(audioData, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: language,
    task: 'transcribe',
    return_timestamps: false,
  });

  return output.text.trim();
}

/**
 * Main entry point: Hybrid STT
 * 1. Try Native Android (Faster, but usually online)
 * 2. Fallback to On-Device Whisper (100% Offline)
 */
export async function transcribeRegional(language = 'hi-IN') {
  return new Promise(async (resolve) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // Convert 'hi-IN' to 'hindi' for Whisper
    const whisperLang = language.startsWith('kn') ? 'kannada' : 'hindi';

    if (SpeechRecognition && navigator.onLine) {
      console.log('Attempting Native STT...');
      const rec = new SpeechRecognition();
      rec.lang = language;
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (e) => resolve(e.results[0][0].transcript);
      rec.onerror = async () => {
        console.warn('Native STT failed, switching to Offline AI...');
        resolve(await runOfflineWhisper(whisperLang));
      };
      
      try {
        rec.start();
        // Timeout for native STT if it hangs
        setTimeout(() => { try { rec.stop(); } catch(e) {} }, 10000);
        return;
      } catch (e) {
        resolve(await runOfflineWhisper(whisperLang));
      }
    } else {
      console.log('Offline or Native unsupported, using Whisper...');
      resolve(await runOfflineWhisper(whisperLang));
    }
  });
}

/**
 * Helper to record audio and run through Whisper
 */
async function runOfflineWhisper(whisperLang) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    return new Promise((resolve) => {
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        try {
          const text = await transcribeOnDevice(blob, whisperLang);
          resolve(text);
        } catch (err) {
          console.error('Offline Whisper failed:', err);
          resolve('');
        }
      };
      
      recorder.start();
      // Record for 8 seconds
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 8000);
    });
  } catch (e) {
    console.error('Mic error in offline mode:', e);
    return '';
  }
}

export function stopListening() {
  // Logic to stop current recording if needed
}
