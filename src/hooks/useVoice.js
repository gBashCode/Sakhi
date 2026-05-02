import { useState } from 'react';
import { transcribeRegional, stopListening } from '@/agents/sttAgent';
import { speakRegional, speakToAsha } from '@/agents/ttsAgent';
import { parseMedical } from '@/agents/nerAgent';
import { triageRisk } from '@/agents/riskAgent';
import { getNextAction } from '@/agents/copilotAgent';

export function useVoice(patient, language = 'hi-IN') {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const start = async () => {
    setRecording(true);
    setLoading(true);
    setResult(null);

    // FIX: Tell ASHA to speak
    speakRegional('Boliye', language);

    try {
      // FIX: Listen in regional language
      const text = await transcribeRegional(null, language);

      if (!text) {
        speakRegional('Mujhe samajh nahi aaya. Dobara boliye.', language);
        setLoading(false);
        setRecording(false);
        return;
      }

      // Process with existing agents
      const medical = parseMedical(text);
      const risk = triageRisk({...medical, age: patient.age});
      const action = getNextAction(patient, medical, risk);

      setResult({text, medical, risk, action});

      // FIX: AI SPEAKS BACK IN REGIONAL LANGUAGE
      if (risk.level === 'high') {
        speakToAsha(medical.patient_name, `Khatra hai. ${action}`, language);
      } else {
        speakToAsha(medical.patient_name, action, language);
      }

    } catch (e) {
      speakRegional('Kuch galat hua. Phir se koshish karo.', language);
      console.error(e);
    }

    setLoading(false);
    setRecording(false);
  };

  const stop = () => {
    stopListening();
    setRecording(false);
    setLoading(false);
  };

  return {recording, start, stop, result, loading};
}
