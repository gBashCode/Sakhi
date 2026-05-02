/**
 * sync.ts — Real backend sync service for src/
 * Reads unsynced visits from Dexie, POSTs to FastAPI, marks synced.
 */
import { db } from '@/lib/db';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export interface SyncResult {
  saved: number;
  message?: string;
}

export async function syncToServer(): Promise<SyncResult> {
  // Get auth token — try localStorage first, then Dexie meta
  let token = localStorage.getItem('sakhi_token');
  if (!token) {
    const record = await db.meta.get('token');
    token = record?.value as string | null;
  }
  if (!token) throw new Error('Not authenticated — please login');

  const unsynced = await db.visits.where('synced').equals(0).toArray();
  if (!unsynced.length) return { saved: 0, message: 'Nothing to sync' };

  const payload = {
    visits: unsynced.map((v) => ({
      client_id: v.clientId,
      patient_id: v.patientId,
      bp_sys: v.bpSys ?? null,
      bp_dia: (v as any).bpDia ?? null,
      weight: (v as any).weight ?? null,
      symptoms: (v as any).symptoms ?? '',
      risk_level: v.riskLevel ?? 'low',
      device_ts: new Date(v.deviceTs).toISOString(),
    })),
  };

  const res = await fetch(`${BASE_URL}/api/v1/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.status.toString());
    throw new Error(`Server error ${res.status}: ${txt}`);
  }

  const data: SyncResult = await res.json().catch(() => ({ saved: unsynced.length }));

  // Mark all as synced in Dexie
  await db.visits.where('synced').equals(0).modify({ synced: 1 });

  return { saved: data.saved ?? unsynced.length };
}
