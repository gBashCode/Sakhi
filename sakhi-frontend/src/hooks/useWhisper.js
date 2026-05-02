import { pipeline } from '@xenova/transformers';

let transcriber = null;

export async function getTranscriber() {
  if (!transcriber) {
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
  }
  return transcriber;
}

export async function transcribeBlob(blob) {
  const t = await getTranscriber();
  
  // Create an object URL from the blob since transformers.js expects a URL or Float32Array
  const url = URL.createObjectURL(blob);
  
  try {
    const output = await t(url, { language: 'hindi', task: 'transcribe' });
    return output.text;
  } finally {
    URL.revokeObjectURL(url);
  }
}
