import { useEffect, useState } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { transcribeBlob } from '../hooks/useWhisper';

export default function NewVisit() {
  const { recording, start, stop } = useRecorder();
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    const handleAudio = async (e) => {
      const blob = e.detail;
      console.log('Audio recorded, starting transcription...');
      setIsTranscribing(true);
      try {
        const text = await transcribeBlob(blob);
        console.log('Transcript:', text);
        setTranscript(text);
      } catch (err) {
        console.error('Transcription failed:', err);
      } finally {
        setIsTranscribing(false);
      }
    };

    window.addEventListener('audio-recorded', handleAudio);
    return () => window.removeEventListener('audio-recorded', handleAudio);
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">New Visit (Voice Input)</h2>
      
      <div className="flex flex-col items-center gap-6 mt-10">
        <button 
          onMouseDown={start} 
          onMouseUp={stop}
          onTouchStart={start}
          onTouchEnd={stop}
          className={`w-32 h-32 rounded-full text-white text-lg font-bold shadow-xl transition-all ${recording ? 'bg-red-600 scale-110 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}
        >
          {recording ? 'Recording...' : 'Hold to Speak'}
        </button>

        {isTranscribing && <p className="text-gray-500 animate-pulse">Transcribing with Whisper AI...</p>}
        
        {transcript && (
          <div className="w-full p-4 bg-white rounded-lg shadow mt-4 border border-gray-100">
            <h3 className="text-sm text-gray-500 font-semibold mb-2">Transcript</h3>
            <p className="text-lg text-gray-900">{transcript}</p>
          </div>
        )}
      </div>
    </div>
  );
}
