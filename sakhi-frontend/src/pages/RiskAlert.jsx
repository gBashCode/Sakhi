import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function RiskAlert() {
  const navigate = useNavigate();
  
  // Get the most recent visit
  const lastVisit = useLiveQuery(
    () => db.visits.orderBy('deviceTs').reverse().first()
  );

  useEffect(() => {
    // If the query has finished and we found out it's NOT high risk, bounce them.
    if (lastVisit !== undefined) {
      if (!lastVisit || lastVisit.riskLevel !== 'high') {
        navigate('/patients');
      }
    }
  }, [lastVisit, navigate]);

  // While waiting for Dexie to return
  if (lastVisit === undefined) {
    return <div className="h-screen bg-red-600"></div>; 
  }

  // Prevent flashing content if we are about to redirect
  if (!lastVisit || lastVisit.riskLevel !== 'high') {
    return null;
  }

  return (
    <div className="bg-red-600 text-white flex flex-col items-center justify-center h-screen px-4 text-center">
      <h1 className="text-5xl font-bold mb-4 uppercase">High Risk Pregnancy</h1>
      <p className="text-2xl mb-12">Refer to PHC Today</p>
      
      <button 
        onClick={() => navigate('/patients')}
        className="bg-white text-red-600 px-8 py-4 rounded-xl text-xl font-bold shadow-lg active:scale-95 transition-transform hover:bg-gray-100"
      >
        Mark as Referred
      </button>
    </div>
  );
}
