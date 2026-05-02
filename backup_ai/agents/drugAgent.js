/**
 * drugAgent.js — MoHFW ANC Due Medications Checker
 *
 * Computes which drugs/supplements are overdue based on gestational age
 * and what has already been recorded for the patient.
 * Pure JS. Zero server calls. Works offline.
 *
 * MoHFW ANC protocol reference:
 *  IFA      → start at 14 weeks (180 tablets total)
 *  TT-1     → at 16 weeks
 *  TT-2     → at 20 weeks (≥4 weeks after TT-1)
 *  Calcium  → start at 20 weeks (360 tablets)
 *  Albendazole → single dose at 14–16 weeks (2nd trimester)
 */

import { getGestationalAge } from './copilotAgent.js';

/**
 * checkDueMeds(patient)
 *
 * @param {object} patient
 *   {
 *     lmp_date: string|null,  // "YYYY-MM-DD"
 *     lmp:      string|null,  // alternate field name
 *     ifaStarted:       boolean,
 *     tt1Done:          boolean,
 *     tt2Done:          boolean,
 *     calciumStarted:   boolean,
 *     albendazoleDone:  boolean,
 *   }
 *
 * @returns {Array<{ drug: string, msg: string, urgency: 'overdue'|'due'|'upcoming' }>}
 */
export function checkDueMeds(patient) {
  if (!patient) return [];

  const lmp  = patient.lmp_date ?? patient.lmp ?? null;
  const ga   = getGestationalAge(lmp); // weeks
  const due  = [];

  // ── IFA: Iron-Folic Acid — start at 14 weeks ─────────────────────────────
  if (ga >= 14 && !patient.ifaStarted) {
    due.push({
      drug:    'IFA',
      msg:     'IFA shuru karo: 1 goli roz, khane ke baad',
      urgency: ga >= 20 ? 'overdue' : 'due',
    });
  }

  // ── TT-1: Tetanus Toxoid first dose — at 16 weeks ────────────────────────
  if (ga >= 16 && !patient.tt1Done) {
    due.push({
      drug:    'TT1',
      msg:     'TT ka pehla tika (TT-1) lagwana hai',
      urgency: ga >= 22 ? 'overdue' : 'due',
    });
  }

  // ── Albendazole: deworming — single dose at 14–16 weeks ──────────────────
  if (ga >= 14 && ga < 24 && !patient.albendazoleDone) {
    due.push({
      drug:    'Albend',
      msg:     'Albendazole ki ek goli (deworming)',
      urgency: 'due',
    });
  }

  // ── TT-2: Tetanus Toxoid second dose — at 20 weeks (≥4w after TT-1) ─────
  if (ga >= 20 && patient.tt1Done && !patient.tt2Done) {
    due.push({
      drug:    'TT2',
      msg:     'TT ka doosra tika (TT-2) lagwana hai',
      urgency: ga >= 26 ? 'overdue' : 'due',
    });
  }

  // ── Calcium: start at 20 weeks ───────────────────────────────────────────
  if (ga >= 20 && !patient.calciumStarted) {
    due.push({
      drug:    'Ca²⁺',
      msg:     'Calcium ki goli shuru karo: 2 goli roz',
      urgency: ga >= 28 ? 'overdue' : 'due',
    });
  }

  return due;
}
