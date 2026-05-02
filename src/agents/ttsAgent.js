let hindiVoice = null;
let kannadaVoice = null;

// Load voices when app starts
function loadVoices() {
  const voices = window.speechSynthesis.getVoices();

  // FIX: Find best Hindi voice
  hindiVoice = voices.find(v => v.lang === 'hi-IN') ||
               voices.find(v => v.name.includes('Hindi')) ||
               voices.find(v => v.name.includes('Google हिन्दी'));

  // FIX: Find Kannada voice
  kannadaVoice = voices.find(v => v.lang === 'kn-IN') ||
                 voices.find(v => v.name.includes('Kannada'));

  console.log('Hindi voice:', hindiVoice?.name);
  console.log('Kannada voice:', kannadaVoice?.name);
}

// Android needs this
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices(); // Load immediately
}

export function speakRegional(text, language = 'hi-IN') {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis is not supported on this device');
    return;
  }
  // Stop any current speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // FIX: Set language and voice
  utterance.lang = language;
  if (language === 'hi-IN' && hindiVoice) {
    utterance.voice = hindiVoice;
  } else if (language === 'kn-IN' && kannadaVoice) {
    utterance.voice = kannadaVoice;
  }

  utterance.rate = 0.85; // Slower for ASHA
  utterance.pitch = 1;
  utterance.volume = 1;

  // FIX: Handle errors
  utterance.onerror = (e) => {
    console.error('TTS Error:', e);
  };

  window.speechSynthesis.speak(utterance);
}

// FIX: Speak with ASHA's name
export function speakToAsha(name, message, language = 'hi-IN') {
  const fullText = name ? `${name} behen, ${message}` : message;
  speakRegional(fullText, language);
}
