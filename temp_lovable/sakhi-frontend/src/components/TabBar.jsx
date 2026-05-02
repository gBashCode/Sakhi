import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { syncToServer } from '../services/sync';

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
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
    if (!online) {
      alert("Offline! Cannot sync.");
      return;
    }
    try {
      const res = await syncToServer();
      alert(`Synced ${res.saved} records`);
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    }
  };

  const navItem = (path, label) => {
    const active = location.pathname === path;
    return (
      <button 
        onClick={() => navigate(path)} 
        className={`flex-1 py-4 text-center font-bold text-sm ${active ? 'text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 w-full bg-white shadow-[0_-2px_15px_rgba(0,0,0,0.1)] flex z-50">
      {navItem('/patients', 'Home')}
      {navItem('/due', 'Due')}
      <button 
        onClick={handleSync} 
        className={`flex-1 py-4 text-center font-bold text-sm ${online ? 'text-green-600' : 'text-gray-300 cursor-not-allowed'}`}
      >
        Sync
      </button>
    </div>
  );
}
