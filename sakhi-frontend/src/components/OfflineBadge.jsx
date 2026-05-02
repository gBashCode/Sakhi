import { useEffect, useState } from 'react';

export default function OfflineBadge() {
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
  
  return !online ? <div id="offline-badge" className="bg-red-600 text-white text-center py-1 font-semibold text-sm shadow-md animate-pulse">OFFLINE MODE</div> : null;
}
