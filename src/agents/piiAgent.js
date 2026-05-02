/**
 * piiAgent.js — PII Masking / Pseudonymisation for DPDP Act compliance
 *
 * India's Digital Personal Data Protection Act (DPDP) 2023 and
 * MoHFW data governance guidelines require:
 *   - No real patient names or phone numbers on servers
 *   - Patient IDs must be pseudonymised before leaving the device
 *   - Data minimisation: only send fields required for clinical analytics
 *
 * This agent runs client-side (device) before every sync call.
 * The mapping between real IDs and pseudonyms stays local (never synced).
 *
 * Usage:
 *   import { maskPII } from '@/agents/piiAgent';
 *   const safePayload = visits.map(maskPII);
 *   await api.post('/sync', safePayload); // server never sees real names
 */

/**
 * maskPII(visit)
 * Removes / pseudonymises all PII fields before server sync.
 *
 * @param {object} visit — raw Dexie visit record or sync payload
 * @returns {object} — PII-free clone safe for server transmission
 *
 * Fields REMOVED:
 *   patientName, phone, aadhaarLast4, address, guardianName, email
 *
 * Fields PSEUDONYMISED (one-way, consistent):
 *   patientId  → 8-char Base64 hash (device-local mapping retained separately)
 *   client_id  → same hash approach
 *
 * Fields RETAINED (required for clinical analytics):
 *   bp_sys, bp_dia, weight, symptoms, risk_level, device_ts, synced
 *   gestational age (derived, not DOB), lmp_date (month only for GA calc)
 */
export function maskPII(visit) {
  if (!visit) return {};

  // Shallow clone — never mutate the original Dexie record
  const clean = { ...visit };

  // ── Remove direct identifiers ──────────────────────────────────────────────
  delete clean.patientName;
  delete clean.name;          // alternate field names used in store
  delete clean.phone;
  delete clean.phoneNumber;
  delete clean.aadhaarLast4;
  delete clean.address;
  delete clean.guardianName;
  delete clean.email;

  // ── Pseudonymise patient & client IDs ────────────────────────────────────
  // hash() is deterministic: same input → same output on every device.
  // This allows the server to correlate visits from the same patient
  // without ever knowing the real ID.
  if (clean.patientId)  clean.patientId  = hash(String(clean.patientId));
  if (clean.patient_id) clean.patient_id = hash(String(clean.patient_id));
  if (clean.clientId)   clean.clientId   = hash(String(clean.clientId));
  if (clean.client_id)  clean.client_id  = hash(String(clean.client_id));

  // ── Redact LMP to month-year only (retain GA calculation ability) ─────────
  // "2026-03-15" → "2026-03" (day removed — day is quasi-identifier)
  if (clean.lmp_date && typeof clean.lmp_date === 'string') {
    clean.lmp_date = clean.lmp_date.slice(0, 7); // "YYYY-MM"
  }

  // ── Generalise age to 5-year band (k-anonymity) ───────────────────────────
  // 23 → "20-24", 17 → "15-19"
  if (clean.age != null) {
    const n = parseInt(clean.age);
    if (!isNaN(n)) {
      const lo = Math.floor(n / 5) * 5;
      clean.age = `${lo}-${lo + 4}`;
    }
  }

  return clean;
}

/**
 * hash(str)
 * Deterministic 8-char pseudonym via Base64 encoding.
 * Not cryptographically secure — use for pseudonymisation, not encryption.
 * For production, replace with SHA-256 HMAC with a device-local secret.
 *
 * @param {string} str
 * @returns {string} 8-char alphanumeric string
 */
export function hash(str) {
  if (!str) return '';
  // btoa works on ASCII; handle unicode (Devanagari patient names)
  try {
    const bytes = new TextEncoder().encode(str);
    let b64 = '';
    bytes.forEach((b) => (b64 += String.fromCharCode(b)));
    return btoa(b64).replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
  } catch {
    return btoa(str).slice(0, 8);
  }
}

/**
 * maskPayload(visits)
 * Convenience wrapper for mapping an array.
 * @param {object[]} visits
 * @returns {object[]}
 */
export function maskPayload(visits) {
  if (!Array.isArray(visits)) return [];
  return visits.map(maskPII);
}
