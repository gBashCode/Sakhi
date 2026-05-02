/**
 * ttsAgent.js — Simple Text-to-Speech for ASHA workers using built-in Web Speech API
 */

export async function speakHindi(text, lang = 'hi') {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn('TTS not supported');
      return resolve();
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Attempt to find a Hindi/Local voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'hi-IN' || v.name.includes('Hindi'))
               || voices.find(v => v.lang.startsWith(lang))
               || voices.find(v => v.lang.startsWith('hi'));

    if (voice) {
      utterance.voice = voice;
    }

    utterance.lang = lang === 'hi' ? 'hi-IN' : (lang === 'kn' ? 'kn-IN' : 'en-IN');
    utterance.rate = 0.9; // Slightly slower for clarity for ASHA workers
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (e) => {
      console.error('TTS Error:', e);
      resolve();
    };

    window.speechSynthesis.speak(utterance);

    // Fallback for some browsers where onend doesn't fire reliably
    setTimeout(resolve, text.length * 100 + 1000);
  });
}

// Preload voices - Android Chrome needs this
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
