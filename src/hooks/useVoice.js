import { useState, useCallback, useRef, useEffect } from 'react';
import { transcribeOnDevice, isModelReady } from '@/agents/sttAgent';
import { parseMedical } from '@/agents/nerAgent';
import { triageRisk } from '@/agents/riskAgent';
import { getNextAction } from '@/agents/copilotAgent';

export function useVoice(callbackOrPatient) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [modelLoading, setModelLoading] = useState(!isModelReady());

  useEffect(() => {
    if (!modelLoading) return;
    const check = setInterval(() => {
      if (isModelReady()) {
        setModelLoading(false);
        clearInterval(check);
      }
    }, 500);
    return () => clearInterval(check);
  }, [modelLoading]);

  const mrRef = useRef(null);
  const chunksRef = useRef([]);

  // Determine if we were passed a callback or a patient object
  const onComplete = typeof callbackOrPatient === 'function' ? callbackOrPatient : null;
  const patient = typeof callbackOrPatient === 'object' ? callbackOrPatient : null;

  const start = useCallback(async () => {
    if (modelLoading) {
      alert('AI model downloading. Please wait 30 seconds and try again.');
      return;
    }
    console.log('[useVoice] Starting recording...');
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Preferred types for Android/iOS
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/aac';

      const mr = new MediaRecorder(stream, { mimeType });

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        console.log('[useVoice] Recording stopped, processing...');
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (onComplete) {
          await onComplete(blob);
        } else {
          await processAudio(blob);
        }
      };

      mr.start();
      mrRef.current = mr;
      setRecording(true);
      setError(null);
    } catch (err) {
      console.error("[useVoice] Mic access failed:", err);
      setError("Mic access failed. Please check permissions.");
    }
  }, [onComplete, patient, modelLoading]);

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

  return { recording, start, stop, result, loading, error, modelLoading };
}
