import { useEffect, useState } from 'react';
import { db } from '../db';
import { getDuePatients } from '../api';
import { useToken } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function DueList() {
  const [due, setDue] = useState([]);
  const token = useToken();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDue() {
      if (navigator.onLine && token) {
        try {
          const serverDue = await getDuePatients(token);
          await db.meta.put({key: 'dueList', value: serverDue});
          setDue(serverDue);
        } catch(err) {
          console.error(err);
          const cached = await db.meta.get('dueList');
          setDue(cached?.value || []);
        }
      } else {
        const cached = await db.meta.get('dueList');
        setDue(cached?.value || []);
      }
    }
    fetchDue();
  }, [token]);

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Due This Week</h1>
      {due.length === 0 ? <p className="text-gray-500">No due patients found.</p> : null}
      {due.map(p => (
        <div key={p.id} className="bg-yellow-100 p-4 rounded-xl mb-3 shadow-sm border border-yellow-200">
          <p className="font-bold text-lg text-yellow-900">{p.name}</p>
          <p className="text-sm text-yellow-800">{p.due_for} due {p.due_date}</p>
          <button onClick={() => navigate(`/visit/new?patientId=${p.id}`)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg mt-3 font-medium active:scale-95 transition-transform w-full shadow-md">
            Start Visit
          </button>
        </div>
      ))}
    </div>
  );
}
