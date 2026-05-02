import { pipeline, env } from '@xenova/transformers';

// Configuration for offline-first operation
env.allowLocalModels = true;
env.allowRemoteModels = true; 
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.wasmPaths = '/wasm/';

let hfPipeline = null;
let modelStatus = 'idle'; 

export async function initSTT(progressCallback = null) {
  if (hfPipeline) return hfPipeline;
  modelStatus = 'loading';
  try {
    hfPipeline = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny', 
      {
        quantized: true,
        progress_callback: (p) => {
          if (progressCallback && p.status === 'progress') progressCallback(Math.round(p.progress));
        }
      }
    );
    modelStatus = 'ready';
    return hfPipeline;
  } catch (e) {
    modelStatus = 'error';
    console.error('STT Init failed:', e);
    throw e;
  }
}

export function getModelStatus() { return modelStatus; }
export function isModelReady() { return modelStatus === 'ready'; }

/**
 * AGGRESSIVE HYBRID STT
 * Always tries Android Native first (even offline), then fallback to Whisper
 */
export async function transcribeRegional(language = 'hi-IN') {
  return new Promise(async (resolve) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('No Native STT support, jumping to Whisper...');
      resolve(await runOfflineWhisper(language));
      return;
    }

    console.log('Starting Native STT (Attempting Offline)...');
    const rec = new SpeechRecognition();
    rec.lang = language;
    rec.continuous = false;
    rec.interimResults = false;

    let nativeFinished = false;

    rec.onresult = (e) => {
      nativeFinished = true;
      resolve(e.results[0][0].transcript);
    };

    rec.onerror = async (e) => {
      if (nativeFinished) return;
      nativeFinished = true;
      console.warn('Native STT Error:', e.error);
      
      // If native fails due to network (offline + no pack) or other errors, try Whisper
      if (e.error === 'network' || e.error === 'no-speech' || e.error === 'service-not-allowed') {
        console.log('Native failed, falling back to local Whisper AI...');
        resolve(await runOfflineWhisper(language));
      } else {
        resolve(''); // Mic permission or other fatal error
      }
    };

    // Safety timeout for native STT
    setTimeout(async () => {
      if (!nativeFinished) {
        nativeFinished = true;
        try { rec.stop(); } catch(e) {}
        console.log('Native STT timed out, trying Whisper...');
        resolve(await runOfflineWhisper(language));
      }
    }, 7000);

    try {
      rec.start();
    } catch (e) {
      if (!nativeFinished) {
        nativeFinished = true;
        resolve(await runOfflineWhisper(language));
      }
    }
  });
}

async function runOfflineWhisper(language) {
  // Convert lang code
  const whisperLang = language.startsWith('kn') ? 'kannada' : 'hindi';

  // Check if model is ready
  if (modelStatus !== 'ready') {
    console.warn('Whisper not ready. Status:', modelStatus);
    return ''; // Can't do anything if model not ready and native failed
  }

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
          resolve('');
        }
      };
      recorder.start();
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 6000);
    });
  } catch (e) {
    return '';
  }
}

export async function transcribeOnDevice(audioBlob, language = 'hindi') {
  const stt = await initSTT();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
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

export function stopListening() { /* handled by individual instances */ }
