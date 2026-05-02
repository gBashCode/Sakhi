/**
 * copilotAgent.js — CalmOps "One Action" Copilot for ASHA workers
 *
 * Follows the CalmOps principle: never overwhelm with a list.
 * Returns exactly ONE prioritised action in simple Hindi.
 * Runs fully offline — pure JS, no server call.
 *
 * Priority order (highest first):
 *  1. High risk       → immediate PHC referral + 108 call
 *  2. IFA tablet      → if gestational age > 12 weeks and not yet given
 *  3. TT vaccine      → if gestational age > 16 weeks and not yet done
 *  4. ANC overdue     → if last visit > 30 days ago
 *  5. All normal      → reassurance + next appointment
 */

/**
 * getNextAction(patient, visit, risk)
 *
 * @param {object} patient   — from Zustand store / DB
 *   { lmp_date: string|null, name: string, ... }
 * @param {object} visit     — latest visit record
 *   { ifaGiven: boolean, ttDone: boolean, deviceTs: number|string, ... }
 * @param {object} risk      — from riskAgent.triageRisk()
 *   { level: 'high'|'medium'|'low', reasons: string[], protocol: string }
 *
 * @returns {string} — single Hindi action string
 */
export function getNextAction(patient, visit, risk) {
  // ── 1. Highest priority: high risk → immediate referral ─────────────────
  if (risk?.level === 'high') {
    return 'Turant PHC le jao. 108 call karo.';
  }

  const ga = getGestationalAge(patient?.lmp_date ?? patient?.lmp ?? null);

  // ── 2. IFA tablet (Iron-Folic Acid) — MoHFW: start at 12 weeks ──────────
  if (!visit?.ifaGiven && ga > 12) {
    return 'Aaj IFA ki goli dena hai. Roz ek goli, khane ke baad.';
  }

  // ── 3. TT (Tetanus Toxoid) vaccine — MoHFW: TT-1 at 16 weeks ───────────
  if (!visit?.ttDone && ga > 16) {
    return 'TT ka tika lagwana hai. Najdiki PHC ya sub-centre jao.';
  }

  // ── 4. Overdue ANC visit (> 30 days since last visit) ───────────────────
  const daysSinceLast = daysSince(visit?.deviceTs ?? visit?.createdAt ?? null);
  if (daysSinceLast !== null && daysSinceLast > 30) {
    return 'ANC visit due hai. Ghar jao aur patient se milo.';
  }

  // ── 5. Medium risk — monitor, no immediate action ───────────────────────
  if (risk?.level === 'medium') {
    return '3 din mein dobara milna hai. BP check karte rehna.';
  }

  // ── 6. All normal ────────────────────────────────────────────────────────
  return 'Sab normal hai. Agle mahine milna. Achha kaam kar rahi ho!';
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * getGestationalAge(lmp)
 * Returns gestational age in weeks from LMP date string.
 * @param {string|null} lmp — ISO date "YYYY-MM-DD" or null
 * @returns {number} weeks (0 if unknown)
 */
export function getGestationalAge(lmp) {
  if (!lmp) return 0;
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const diff = Date.now() - new Date(lmp).getTime();
  return Math.max(0, Math.floor(diff / msPerWeek));
}

/**
 * daysSince(ts)
 * Returns days elapsed since a timestamp (ms epoch or ISO string).
 * @param {number|string|null} ts
 * @returns {number|null} days, or null if ts is falsy
 */
export function daysSince(ts) {
  if (!ts) return null;
  const ms = typeof ts === 'number' ? ts : new Date(ts).getTime();
  return Math.floor((Date.now() - ms) / 86400000);
}
