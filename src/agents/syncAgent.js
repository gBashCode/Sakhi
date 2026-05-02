import { db } from '@/lib/db';

export async function syncToServer() {
  if (!navigator.onLine) return;
  
  const unsynced = await db.visits.where('synced').equals(0).toArray();
  if (unsynced.length === 0) return;

  console.log(`[Sync] Found ${unsynced.length} unsynced visits. starting...`);

  for (const visit of unsynced) {
    try {
      const response = await fetch('https://sakhi-api.onrender.com/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visit)
      });
      
      if (response.ok) {
        await db.visits.update(visit.id, { synced: 1 });
        console.log(`[Sync] Success: Visit ${visit.id} synced.`);
      }
    } catch (e) {
      console.error(`[Sync] Error syncing visit ${visit.id}:`, e);
      break; // Stop loop on network error
    }
  }
}

// Background sync on network reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncToServer);
}
