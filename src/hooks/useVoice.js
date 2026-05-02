import { useState, useEffect } from 'react';
import { transcribeRegional, stopListening, getModelStatus } from '@/agents/sttAgent';
import { speakRegional, speakToAsha } from '@/agents/ttsAgent';
import { parseMedical } from '@/agents/nerAgent';
import { triageRisk } from '@/agents/riskAgent';
import { getNextAction } from '@/agents/copilotAgent';
import { generateAllDocuments } from '@/agents/documentAgent';


export function useVoice(patient, language = 'hi-IN') {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState(null);

  useEffect(() => {
    // Request mic permission on app start
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach(track => track.stop());
        setPermissionGranted(true);
      })
      .catch(() => alert('Mic permission dena zaroori hai. Settings se allow karein.'));
  }, []);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const start = async () => {
    if (!permissionGranted) {
      alert('Settings → Apps → SakhiAI → Permissions → Microphone → Allow');
      return;
    }

    if (getModelStatus() === 'loading') {
      alert('Offline AI load ho raha hai, kripya 2 minute wait karein.');
      return;
    }

    setRecording(true);
    setLoading(true);
    setResult(null);
    setDocuments(null);

    speakRegional('Boliye', language);

    try {
      // 10s wait for the user to speak. transcribeRegional handles audio buffer natively.
      const text = await transcribeRegional(language);

      if (!text) {
        speakRegional('Mujhe samajh nahi aaya. Dobara boliye.', language);
        setLoading(false);
        setRecording(false);
        return;
      }

      // Process with existing agents
      const medical = parseMedical(text);
      const risk = triageRisk({...medical, age: patient?.age});
      const action = getNextAction(patient, null, risk, language === 'hi-IN' ? 'hi' : 'kn');

      const resultData = {text, medical, risk, action};
      setResult(resultData);

      // GENERATE ALL DOCUMENTS INSTANTLY
      const docs = generateAllDocuments(patient || {}, medical, risk, action);
      setDocuments(docs);

      // Auto-save to phone (optional, but requested)
      // downloadBlob(docs.ancCardPDF, `ANC_${medical.patient_name || 'Patient'}.pdf`);

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

  return {recording, start, stop, result, loading, documents, downloadBlob};
}
