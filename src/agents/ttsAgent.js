let hindiVoice = null;
let kannadaVoice = null;

function loadVoices() {
  if (typeof window === 'undefined') return;
  const voices = window.speechSynthesis.getVoices();
  hindiVoice = voices.find(v => v.lang === 'hi-IN');
  kannadaVoice = voices.find(v => v.lang === 'kn-IN');
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

export function speakRegional(text, language = 'hi-IN') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.voice = language === 'kn-IN'? kannadaVoice : hindiVoice;
  utterance.rate = 0.85; // Slower for ASHA
  window.speechSynthesis.speak(utterance);
}

export function speakToAsha(name, message, language = 'hi-IN') {
  const fullText = name? `${name} behen, ${message}` : message;
  speakRegional(fullText, language);
}
