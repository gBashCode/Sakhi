import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { parseVitals } from '../utils/parseVitals';
import { getRisk } from '../utils/riskEngine';
import { db } from '../db';

export default function VisitForm() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const navigate = useNavigate();

  // ── Voice / Whisper ────────────────────────────────────────────────────────
  const { recording, transcribing, transcript, start, stop } = useVoice();

  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [weight, setWeight] = useState('');
  const [symptoms, setSymptoms] = useState([]);

  // Auto-fill form fields whenever a new transcript arrives
  useEffect(() => {
    if (!transcript) return;
    const data = parseVitals(transcript);
    if (data.bpSys)              setBpSys(data.bpSys);
    if (data.bpDia)              setBpDia(data.bpDia);
    if (data.weight)             setWeight(data.weight);
    if (data.symptoms?.length)   setSymptoms(data.symptoms);
  }, [transcript]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const riskLevel = getRisk({
      bpSys: parseInt(bpSys),
      bpDia: parseInt(bpDia),
      symptoms,
    });
    await db.visits.add({
      clientId: crypto.randomUUID(),
      patientId,
      bpSys:    parseInt(bpSys)    || null,
      bpDia:    parseInt(bpDia)    || null,
      weight:   parseFloat(weight) || null,
      symptoms,
      riskLevel,
      deviceTs: Date.now(),
      synced:   0,
    });

    if (riskLevel === 'high') navigate('/alert');
    else                      navigate('/patients');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">New Visit</h1>
        <p className="text-sm opacity-80">Patient ID: {patientId}</p>
      </header>

      <div className="p-4 flex-1">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">

          {/* ── Mic button — above BP fields ────────────────────────────── */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <button
              onMouseDown={start}
              onMouseUp={stop}
              onTouchStart={start}
              onTouchEnd={stop}
              aria-label={recording ? 'Stop recording' : 'Start recording'}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center
                text-white shadow-xl transition-all select-none
                ${recording
                  ? 'bg-red-600 scale-110 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'}
              `}
            >
              {recording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>

            {transcribing && (
              <p className="flex items-center gap-2 text-gray-500 animate-pulse text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Transcribing with Whisper AI…
              </p>
            )}

            {transcript && !transcribing && (
              <p className="text-sm text-gray-600 italic text-center max-w-xs">
                "{transcript}"
              </p>
            )}
          </div>

          {/* ── BP fields (now auto-filled by voice) ────────────────────── */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">BP Sys</label>
                <input
                  type="number"
                  value={bpSys}
                  onChange={(e) => setBpSys(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">BP Dia</label>
                <input
                  type="number"
                  value={bpDia}
                  onChange={(e) => setBpDia(e.target.value)}
                  placeholder="e.g. 90"
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Symptoms</label>
              <div className="px-3 py-2 border rounded-lg bg-gray-50 min-h-[42px] text-sm text-gray-700">
                {symptoms.length > 0 ? symptoms.join(', ') : 'None detected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          Save Visit Record
        </button>
      </div>
    </div>
  );
}
