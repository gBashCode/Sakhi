/**
 * sync.ts — Real backend sync service
 * Reads unsynced visits from Dexie, masks PII, POSTs to FastAPI, marks synced.
 * Server DB never sees real patient names, phone numbers, or raw IDs.
 */
import { db } from '@/lib/db';
// @ts-ignore
import { maskPII } from '@/agents/piiAgent';

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
    visits: unsynced.map((v) => {
      // ── Apply PII mask BEFORE building the wire payload ────────────────
      // maskPII() removes names/phones, pseudonymises IDs, redacts LMP day.
      // The original Dexie record (v) is never mutated.
      const safe = maskPII(v);
      return {
        client_id:  safe.clientId  ?? safe.client_id,
        patient_id: safe.patientId ?? safe.patient_id,  // pseudonymised
        bp_sys:     safe.bpSys     ?? null,
        bp_dia:     (safe as any).bpDia   ?? null,
        weight:     (safe as any).weight  ?? null,
        symptoms:   (safe as any).symptoms ?? '',
        risk_level: safe.riskLevel ?? 'low',
        device_ts:  new Date(v.deviceTs).toISOString(), // original ts OK
        lmp_date:   (safe as any).lmp_date ?? null,     // YYYY-MM only
        age_band:   (safe as any).age      ?? null,     // "20-24" band
      };
    }),
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
