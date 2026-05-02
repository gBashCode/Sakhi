import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useNavigate } from 'react-router-dom';
import OfflineBadge from '../components/OfflineBadge';
import { syncToServer } from '../services/sync';

export default function PatientList() {
  const patients = useLiveQuery(() => db.patients.toArray(), []);
  const navigate = useNavigate();
  
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const setOn = () => setOnline(true);
    const setOff = () => setOnline(false);
    window.addEventListener('online', setOn);
    window.addEventListener('offline', setOff);
    return () => {
      window.removeEventListener('online', setOn);
      window.removeEventListener('offline', setOff);
    }
  }, []);

  const handleSync = async () => {
    try {
      const res = await syncToServer();
      alert(`Synced ${res.saved} records`);
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <OfflineBadge />
      
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">My Patients</h1>
          <p className="text-sm opacity-80">ASHA Sync Dashboard</p>
        </div>
      </header>

      <div className="p-4 flex-1">
        {!patients ? (
          <p className="text-gray-500 text-center mt-10">Loading patients...</p>
        ) : patients.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">No patients found.</p>
        ) : (
          patients.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow p-4 mb-3 flex justify-between items-center border border-gray-100">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.village}</p>
              </div>
              <button 
                onClick={() => navigate(`/visit/new?patientId=${p.id}`)}
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
              >
                New Visit
              </button>
            </div>
          ))
        )}
      </div>

      <button 
        className="fixed bottom-6 right-6 bg-red-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-red-700 transition-transform hover:scale-105 active:scale-95 text-2xl font-light"
      >
        +
      </button>
    </div>
  );
}
