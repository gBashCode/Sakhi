import Dexie from 'dexie';
export const db = new Dexie('SakhiAI');
db.version(1).stores({
  patients: '++id, name, village',
  visits: '++id, clientId, patientId, bpSys, bpDia, weight, symptoms, riskLevel, deviceTs, synced',
  meta: 'key' // for lastSyncTs, token
});
