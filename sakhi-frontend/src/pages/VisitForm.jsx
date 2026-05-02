import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRecorder } from '../hooks/useRecorder';
import { transcribeBlob } from '../hooks/useWhisper';
import { parseVitals } from '../utils/parseVitals';
import { getRisk } from '../utils/riskEngine';
import { db } from '../db';

export default function VisitForm() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const navigate = useNavigate();

  const { recording, start, stop } = useRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');

  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [weight, setWeight] = useState('');
  const [symptoms, setSymptoms] = useState([]);

  useEffect(() => {
    const handleAudio = async (e) => {
      setIsTranscribing(true);
      try {
        const text = await transcribeBlob(e.detail);
        setTranscript(text);
        
        const data = parseVitals(text);
        if (data.bpSys) setBpSys(data.bpSys);
        if (data.bpDia) setBpDia(data.bpDia);
        if (data.weight) setWeight(data.weight);
        if (data.symptoms.length > 0) setSymptoms(data.symptoms);
      } catch (err) {
        console.error('Transcription failed:', err);
      } finally {
        setIsTranscribing(false);
      }
    };

    window.addEventListener('audio-recorded', handleAudio);
    return () => window.removeEventListener('audio-recorded', handleAudio);
  }, []);

  const handleSave = async () => {
    const riskLevel = getRisk({ bpSys: parseInt(bpSys), bpDia: parseInt(bpDia), symptoms });
    await db.visits.add({
      clientId: crypto.randomUUID(),
      patientId,
      bpSys: parseInt(bpSys) || null,
      bpDia: parseInt(bpDia) || null,
      weight: parseFloat(weight) || null,
      symptoms,
      riskLevel,
      deviceTs: new Date(),
      synced: 0
    });
    
    if (riskLevel === 'high') {
      navigate('/alert');
    } else {
      navigate('/patients');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">New Visit</h1>
        <p className="text-sm opacity-80">Patient ID: {patientId}</p>
      </header>

      <div className="p-4 flex-1">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <button 
              onMouseDown={start} 
              onMouseUp={stop}
              onTouchStart={start}
              onTouchEnd={stop}
              className={`w-24 h-24 rounded-full text-white font-bold shadow-xl transition-all ${recording ? 'bg-red-600 scale-110 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}
            >
              {recording ? 'Mic On' : 'Hold Mic'}
            </button>
            {isTranscribing && <p className="text-gray-500 animate-pulse">Transcribing via Whisper...</p>}
            {transcript && <p className="text-sm text-gray-600 italic">"{transcript}"</p>}
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">BP Sys</label>
                <input type="number" value={bpSys} onChange={e => setBpSys(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">BP Dia</label>
                <input type="number" value={bpDia} onChange={e => setBpDia(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Symptoms</label>
              <div className="px-3 py-2 border rounded-lg bg-gray-50 min-h-[42px]">
                {symptoms.length > 0 ? symptoms.join(', ') : 'None detected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <button onClick={handleSave} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform">
          Save Visit Record
        </button>
      </div>
    </div>
  );
}
