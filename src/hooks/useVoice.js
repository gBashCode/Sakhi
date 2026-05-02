/**
 * useVoice.js — React hook for mic recording + on-device Whisper transcription.
 *
 * Delegates all model management to sttAgent.js (singleton, browser-cached).
 * Works fully offline after the 40MB model is cached on first use.
 *
 * Returns:
 *   recording    — boolean, true while mic is active
 *   transcribing — boolean, true while Whisper is running
 *   transcript   — string, latest transcription (e.g. "BP 150 by 90 vajan 54 kilo")
 *   start()      — begin recording
 *   stop()       — stop recording and kick off transcription
 *   reset()      — clear transcript
 */
import { useState, useCallback, useRef } from 'react';
import { transcribeOnDevice, warmUpSTT } from '@/agents/sttAgent';

// Warm up the model as soon as this module is imported (background fetch)
warmUpSTT();

export function useVoice() {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
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
        // Release mic immediately
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setTranscribing(true);
        try {
          // ── On-device Whisper via sttAgent ──────────────────────────────
          // Works in airplane mode after first-load cache (IndexedDB / Cache API)
          const text = await transcribeOnDevice(blob);
          setTranscript(text);
        } catch (err) {
          console.error('[useVoice] Transcription failed:', err);
          setTranscript('');
        } finally {
          setTranscribing(false);
        }
      };

      mr.start();
      mrRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error('[useVoice] Mic access failed:', err);
    }
  }, []);

  const stop = useCallback(() => {
    if (mrRef.current && mrRef.current.state !== 'inactive') {
      mrRef.current.stop();
    }
    setRecording(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
  }, []);

  return { recording, transcribing, transcript, start, stop, reset };
}
