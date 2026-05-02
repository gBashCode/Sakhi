import { useState, useCallback, useRef } from 'react';
import { transcribeOnDevice } from '@/agents/sttAgent';
import { parseMedical } from '@/agents/nerAgent';
import { triageRisk } from '@/agents/riskAgent';
import { getNextAction } from '@/agents/copilotAgent';

export function useVoice(patient) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const mrRef = useRef(null);
  const chunksRef = useRef([]);

  const start = useCallback(async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(blob);
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
      setError(null);
    } catch (err) {
      setError("Mic access failed");
    }
  }, [patient]);

  const stop = useCallback(() => {
    if (mrRef.current && mrRef.current.state !== 'inactive') {
      mrRef.current.stop();
    }
    setRecording(false);
  }, []);

  const processAudio = async (blob) => {
    setLoading(true);
    setError(null);
    try {
      const text = await transcribeOnDevice(blob);
      if (!text) throw new Error('Could not hear. Speak louder.');
      const medical = parseMedical(text);
      const risk = triageRisk({...medical, age: patient?.age});
      const action = getNextAction(patient, medical, risk);
      setResult({text, medical, risk, action});
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return { recording, start, stop, result, loading, error };
}
