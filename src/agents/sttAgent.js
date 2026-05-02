import { SpeechRecognition } from '@capacitor-community/speech-recognition';

/**
 * 🚀 NATIVE OFFLINE STT AGENT
 * Uses the phone's native Android Speech Engine.
 * Works 100% offline IF the Hindi/Kannada voice pack is on the phone.
 * No 140MB download needed!
 */

export async function initSTT() {
  try {
    const perm = await SpeechRecognition.requestPermissions();
    return perm.speech === 'granted';
  } catch (e) {
    console.error('Speech permissions failed:', e);
    return false;
  }
}

export function getModelStatus() { return 'ready'; }
export function isModelReady() { return true; }

export async function transcribeRegional(language = 'hi-IN') {
  return new Promise(async (resolve) => {
    try {
      // 1. Check if available
      const { available } = await SpeechRecognition.available();
      if (!available) {
        console.warn('Native Speech not available');
        resolve('');
        return;
      }

      // 2. Start Listening
      let resolved = false;
      
      await SpeechRecognition.start({
        language: language,
        maxResults: 1,
        prompt: "Boliye...",
        partialResults: false,
        popup: true, // Shows the native Google Listening UI (best for offline)
      });

      // 3. Handle Result via Listener
      const listener = await SpeechRecognition.addListener('partialResults', (data) => {
        if (data.matches && data.matches.length > 0 && !resolved) {
          resolved = true;
          resolve(data.matches[0]);
          SpeechRecognition.stop();
        }
      });

      // Since we use popup: true, most Androids return the result directly or via listener
      // We also add a timeout safety
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          SpeechRecognition.stop();
          resolve('');
        }
      }, 10000);

    } catch (e) {
      console.error('Native STT failed:', e);
      resolve('');
    }
  });
}

// Fallback for web/debug
export function stopListening() {
  SpeechRecognition.stop();
}

/**
 * Helper to check if offline packs are needed
 */
export async function checkOfflinePacks() {
  const { languages } = await SpeechRecognition.getSupportedLanguages();
  return languages;
}
