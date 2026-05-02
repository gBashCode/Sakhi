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
 * getNextAction(patient, visit, risk, lang = 'hi')
 *
 * @param {object} patient   — from Zustand store / DB
 * @param {object} visit     — latest visit record
 * @param {object} risk      — from riskAgent.triageRisk()
 * @param {string} lang      — selected language ('hi', 'en', 'kn')
 *
 * @returns {string} — single action string in selected language
 */
export function getNextAction(patient, visit, risk, lang = 'hi') {
  const instructions = {
    hi: {
      high: 'Turant PHC le jao. BP zyada hai.',
      ifa: 'Aaj IFA ki 1 goli dena hai.',
      tt: 'TT ka tika lagwana hai. Najdiki PHC ya sub-centre jao.',
      overdue: 'ANC visit due hai. Ghar jao aur patient se milo.',
      medium: '3 din mein dobara milna hai. BP check karte rehna.',
      normal: 'Sab normal hai. Agle mahine milna. Achha kaam kar rahi ho!'
    },
    en: {
      high: 'Refer to PHC immediately. High BP detected.',
      ifa: 'Provide 1 IFA tablet today.',
      tt: 'TT vaccination due. Go to nearest PHC or sub-centre.',
      overdue: 'ANC visit is overdue. Visit patient at home.',
      medium: 'Follow up in 3 days. Monitor BP closely.',
      normal: 'All parameters normal. Follow up next month. Good job!'
    },
    kn: {
      high: 'ತಕ್ಷಣ PHC ಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ. BP ಹೆಚ್ಚಾಗಿದೆ.',
      ifa: 'ಇಂದು ಒಂದು IFA ಮಾತ್ರೆ ನೀಡಬೇಕು.',
      tt: 'TT ಲಸಿಕೆ ಹಾಕಿಸಬೇಕು. ಹತ್ತಿರದ PHC ಅಥವಾ ಉಪ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಿ.',
      overdue: 'ANC ಭೇಟಿ ಬಾಕಿ ಇದೆ. ರೋಗಿಯ ಮನೆಗೆ ಭೇಟಿ ನೀಡಿ.',
      medium: '3 ದಿನಗಳಲ್ಲಿ ಮತ್ತೆ ಭೇಟಿ ಮಾಡಿ. BP ಪರೀಕ್ಷಿಸುತ್ತಿರಿ.',
      normal: 'ಎಲ್ಲವೂ ಸಾಮಾನ್ಯವಾಗಿದೆ. ಮುಂದಿನ ತಿಂಗಳು ಭೇಟಿ ಮಾಡಿ. ಒಳ್ಳೆಯ ಕೆಲಸ!'
    }
  };

  const t = instructions[lang] || instructions.hi;

  // ── 1. Highest priority: high risk → immediate referral ─────────────────
  if (risk?.level === 'high') {
    return t.high;
  }

  const ga = getGestationalAge(patient?.lmp_date ?? patient?.lmp ?? null);

  // ── 2. IFA tablet (Iron-Folic Acid) ─────────────────────────────────────
  if (!visit?.ifaGiven && ga > 12) {
    return t.ifa;
  }

  // ── 3. TT (Tetanus Toxoid) vaccine — MoHFW: TT-1 at 16 weeks ───────────
  if (!visit?.ttDone && ga > 16) {
    return t.tt;
  }

  // ── 4. Overdue ANC visit (> 30 days since last visit) ───────────────────
  const daysSinceLast = daysSince(visit?.deviceTs ?? visit?.createdAt ?? null);
  if (daysSinceLast !== null && daysSinceLast > 30) {
    return t.overdue;
  }

  // ── 5. Medium risk — monitor, no immediate action ───────────────────────
  if (risk?.level === 'medium') {
    return t.medium;
  }

  // ── 6. All normal ────────────────────────────────────────────────────────
  return t.normal;
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
