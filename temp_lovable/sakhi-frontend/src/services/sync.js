import { db } from '../db';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function syncToServer() {
  const tokenRecord = await db.meta.get('token');
  if (!tokenRecord) throw new Error('No auth token found');
  
  const unsynced = await db.visits.where('synced').equals(0).toArray();
  if (!unsynced.length) return {saved: 0};
  
  const payload = {
    visits: unsynced.map(v => ({
      client_id: v.clientId, 
      patient_id: v.patientId, 
      bp_sys: v.bpSys,
      bp_dia: v.bpDia, 
      weight: v.weight, 
      symptoms: v.symptoms,
      risk_level: v.riskLevel, 
      device_ts: v.deviceTs
    }))
  };
  
  const res = await fetch(`${BASE_URL}/api/v1/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${tokenRecord.value}`
    },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) throw new Error('Server returned ' + res.status);
  
  const data = await res.json();
  
  await db.visits.where('synced').equals(0).modify({synced: 1});
  
  return data;
}
