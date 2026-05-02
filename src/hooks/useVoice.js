import { useState, useCallback, useRef } from 'react';
import { pipeline, env } from '@xenova/transformers';

// Allow Xenova to cache models in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton transcriber — only loaded once across all hook instances
let _transcriber = null;

async function getTranscriber() {
  if (!_transcriber) {
    _transcriber = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny',
    );
  }
  return _transcriber;
}

/**
 * useVoice — unified hook for recording + Whisper transcription.
 *
 * Returns:
 *   recording   — boolean, true while mic is active
 *   transcribing — boolean, true while Whisper is running
 *   transcript  — string, latest transcription result
 *   start()     — begin recording
 *   stop()      — stop recording and kick off transcription
 *   reset()     — clear transcript
 */
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
        // Stop all mic tracks
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setTranscribing(true);
        try {
          const t = await getTranscriber();
          const url = URL.createObjectURL(blob);
          const output = await t(url, { language: 'hindi', task: 'transcribe' });
          URL.revokeObjectURL(url);
          setTranscript(output.text?.trim() ?? '');
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
    mrRef.current?.stop();
    setRecording(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
  }, []);

  return { recording, transcribing, transcript, start, stop, reset };
}
