import { pipeline, env } from '@xenova/transformers';

// Configuration for offline-first operation
env.allowLocalModels = true;
env.allowRemoteModels = true; 
env.backends.onnx.wasm.numThreads = 1;

// CRITICAL: Point to the wasm files in the public folder
env.backends.onnx.wasm.wasmPaths = '/wasm/';

let hfPipeline = null;
let modelStatus = 'idle'; 

/**
 * REVERTED TO ON-DEVICE WHISPER (WHISPER-TINY)
 * This avoids the Google Assistant popup and runs 100% inside the app.
 */
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

export async function transcribeRegional(language = 'hi-IN') {
  return new Promise(async (resolve) => {
    // Check if model is ready
    if (modelStatus !== 'ready') {
      console.warn('Whisper not ready. Status:', modelStatus);
      resolve(''); 
      return;
    }

    const whisperLang = language.startsWith('kn') ? 'kannada' : 'hindi';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

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
      // Record for 6 seconds
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 6000);
    } catch (e) {
      resolve('');
    }
  });
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

export function stopListening() {}
