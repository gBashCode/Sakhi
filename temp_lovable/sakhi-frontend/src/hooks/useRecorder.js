import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMR] = useState(null);

  const start = async () => {
    if (Capacitor.isNativePlatform()) {
      const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
      if (!hasPermission.value) {
        await VoiceRecorder.requestAudioRecordingPermission();
      }
      await VoiceRecorder.startRecording();
      setRecording(true);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, {type: 'audio/webm'});
        window.dispatchEvent(new CustomEvent('audio-recorded', {detail: blob}));
      };
      mr.start();
      setMR(mr);
      setRecording(true);
    }
  };

  const stop = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { value } = await VoiceRecorder.stopRecording();
        setRecording(false);
        const blob = await fetch(`data:audio/aac;base64,${value.recordDataBase64}`).then(r => r.blob());
        window.dispatchEvent(new CustomEvent('audio-recorded', {detail: blob}));
      } catch (err) {
        console.error('Failed to stop recording native:', err);
      }
    } else {
      mediaRecorder?.stop();
      setRecording(false);
    }
  };

  return {recording, start, stop};
}
