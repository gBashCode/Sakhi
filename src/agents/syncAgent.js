import Dexie from 'dexie';
const db = new Dexie('SakhiDB');
db.version(1).stores({ visits: '++id, patient_id, synced, timestamp' });

export async function saveVisit(data) {
  await db.visits.add({...data, synced: 0, timestamp: Date.now()});
  if (navigator.onLine) syncToServer();
}

async function syncToServer() {
  const unsynced = await db.visits.where('synced').equals(0).toArray();
  for (const visit of unsynced) {
    try {
      await fetch('https://sakhi-api.onrender.com/api/sync', {
        method: 'POST',
        body: JSON.stringify(visit)
      });
      await db.visits.update(visit.id, {synced: 1});
    } catch (e) { break; }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', syncToServer);
}
