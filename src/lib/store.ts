import { create } from "zustand";
import type { Lang } from "./i18n";

/* ── Types ── */
export type Risk = "low" | "medium" | "high";

export type DueItem = {
  type: "anc" | "vaccine" | "followup" | "iron";
  label: string;
  dueDate: number; // timestamp
};

export type Visit = {
  id: string;
  patientId: string;
  bpSys: number | null;
  bpDia: number | null;
  weight: number | null;
  symptoms: string;
  risk: Risk;
  recommendation: string;
  createdAt: number;
  synced: boolean;
};

export type Patient = {
  id: string;
  name: string;
  age: string;
  phone?: string;
  village?: string;
  pregnancyMonth?: string;
  pregnancyWeek?: number;
  lmp?: string; // YYYY-MM-DD
  edd?: string; // YYYY-MM-DD
  symptoms: string;
  vaccination?: string;
  risk: Risk;
  recommendation: string;
  createdAt: number;
  lastVisit?: number;
  synced: boolean;
  referred?: boolean;
  dueItems?: DueItem[];
};

export type Settings = {
  voiceEnabled: boolean;
  syncOnWifiOnly: boolean;
};

type Store = {
  /* ── auth ── */
  lang: Lang;
  setLang: (l: Lang) => void;
  loggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
  userName: string;
  setUserName: (n: string) => void;

  /* ── patients ── */
  patients: Patient[];
  addPatient: (p: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  markReferred: (id: string) => void;

  /* ── visits ── */
  visits: Visit[];
  addVisit: (v: Visit) => void;

  /* ── sync ── */
  syncAll: () => void;
  lastSyncTime: number | null;
  syncProgress: number;
  failedSyncs: number;
  retrySync: () => void;

  /* ── settings ── */
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;

  /* ── demo ── */
  isDemo: boolean;
  setDemo: (v: boolean) => void;
};

/* ── Helpers ── */
const DAY = 86400000;
const now = Date.now();

function futureDate(days: number) { return now + days * DAY; }
function pastDate(days: number) { return now - days * DAY; }
function dateStr(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ── Mock data ── */
const initialPatients: Patient[] = [
  {
    id: "p1",
    name: "Sunita Devi",
    age: "26",
    phone: "9876543210",
    village: "Tumkur",
    pregnancyMonth: "8",
    pregnancyWeek: 34,
    lmp: dateStr(pastDate(238)),
    edd: dateStr(futureDate(42)),
    symptoms: "Headache, mild fever",
    risk: "high",
    recommendation: "Refer to PHC within 24 hours",
    createdAt: pastDate(2),
    lastVisit: pastDate(2),
    synced: false,
    dueItems: [
      { type: "anc", label: "ANC Visit #4", dueDate: futureDate(1) },
      { type: "iron", label: "IFA tablet refill", dueDate: now },
    ],
  },
  {
    id: "p2",
    name: "Baby Arjun",
    age: "0.5",
    phone: "9123456789",
    village: "Tumkur",
    vaccination: "DPT-2 due in 3 days",
    symptoms: "Healthy",
    risk: "low",
    recommendation: "Schedule DPT-2 vaccine visit",
    createdAt: pastDate(5),
    lastVisit: pastDate(5),
    synced: false,
    dueItems: [
      { type: "vaccine", label: "DPT-2 vaccine", dueDate: futureDate(3) },
    ],
  },
  {
    id: "p3",
    name: "Meena Kumari",
    age: "29",
    phone: "9988776655",
    village: "Hoskote",
    pregnancyMonth: "5",
    pregnancyWeek: 22,
    lmp: dateStr(pastDate(154)),
    edd: dateStr(futureDate(126)),
    symptoms: "Routine ANC visit",
    risk: "low",
    recommendation: "Continue iron + folic acid",
    createdAt: pastDate(7),
    lastVisit: pastDate(3),
    synced: true,
    dueItems: [
      { type: "iron", label: "Iron supplement check", dueDate: futureDate(5) },
    ],
  },
  {
    id: "p4",
    name: "Lakshmi Bai",
    age: "27",
    phone: "9556677889",
    village: "Mandya",
    pregnancyMonth: "7",
    pregnancyWeek: 30,
    lmp: dateStr(pastDate(210)),
    edd: dateStr(futureDate(70)),
    symptoms: "Swelling in legs, mild fatigue",
    risk: "high",
    recommendation: "High-risk pregnancy. Refer to nearest PHC within 24 hours.",
    createdAt: pastDate(1),
    lastVisit: pastDate(1),
    synced: false,
    dueItems: [
      { type: "followup", label: "High-risk follow-up", dueDate: now },
    ],
  },
  {
    id: "p5",
    name: "Radha Sharma",
    age: "24",
    phone: "9334455667",
    village: "Tumkur",
    pregnancyMonth: "3",
    pregnancyWeek: 14,
    lmp: dateStr(pastDate(98)),
    edd: dateStr(futureDate(182)),
    symptoms: "Morning sickness, mild nausea",
    risk: "medium",
    recommendation: "Monitor weight gain. Next ANC visit in 2 weeks.",
    createdAt: pastDate(10),
    lastVisit: pastDate(4),
    synced: true,
    dueItems: [
      { type: "anc", label: "ANC Visit #2", dueDate: futureDate(7) },
    ],
  },
  {
    id: "p6",
    name: "Baby Riya",
    age: "0.3",
    phone: "9776655443",
    village: "Hoskote",
    vaccination: "BCG — missed 2 days ago",
    symptoms: "Healthy",
    risk: "medium",
    recommendation: "Schedule BCG vaccine immediately",
    createdAt: pastDate(14),
    lastVisit: pastDate(8),
    synced: true,
    dueItems: [
      { type: "vaccine", label: "BCG vaccine (overdue)", dueDate: pastDate(2) },
    ],
  },
];

const initialVisits: Visit[] = [
  {
    id: "v1", patientId: "p1", bpSys: 150, bpDia: 95, weight: 62,
    symptoms: "Headache, mild fever", risk: "high",
    recommendation: "Refer to PHC within 24 hours",
    createdAt: pastDate(2), synced: false,
  },
  {
    id: "v2", patientId: "p4", bpSys: 145, bpDia: 92, weight: 58,
    symptoms: "Swelling in legs, mild fatigue", risk: "high",
    recommendation: "High-risk pregnancy. Refer to nearest PHC.",
    createdAt: pastDate(1), synced: false,
  },
  {
    id: "v3", patientId: "p3", bpSys: 118, bpDia: 76, weight: 55,
    symptoms: "Routine ANC visit", risk: "low",
    recommendation: "Continue iron + folic acid",
    createdAt: pastDate(3), synced: true,
  },
  {
    id: "v4", patientId: "p5", bpSys: 125, bpDia: 82, weight: 50,
    symptoms: "Morning sickness, mild nausea", risk: "medium",
    recommendation: "Monitor weight gain",
    createdAt: pastDate(4), synced: true,
  },
];

/* ── Store ── */
export const useStore = create<Store>((set) => ({
  /* auth */
  lang: (localStorage.getItem("ss_lang") as Lang) || "en",
  setLang: (l) => {
    localStorage.setItem("ss_lang", l);
    set({ lang: l });
  },
  loggedIn: false,
  setLoggedIn: (v) => set({ loggedIn: v }),
  userName: localStorage.getItem("sakhi_username") || "Asha",
  setUserName: (n) => {
    localStorage.setItem("sakhi_username", n);
    set({ userName: n });
  },

  /* patients */
  patients: initialPatients,
  addPatient: (p) => set((s) => ({ patients: [p, ...s.patients] })),
  updatePatient: (id, updates) =>
    set((s) => ({
      patients: s.patients.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  markReferred: (id) =>
    set((s) => ({
      patients: s.patients.map((p) =>
        p.id === id ? { ...p, referred: true, risk: "medium" as Risk } : p
      ),
    })),

  /* visits */
  visits: initialVisits,
  addVisit: (v) => set((s) => ({ visits: [v, ...s.visits] })),

  /* sync */
  syncAll: () =>
    set((s) => ({
      patients: s.patients.map((p) => ({ ...p, synced: true })),
      visits: s.visits.map((v) => ({ ...v, synced: true })),
      lastSyncTime: Date.now(),
      syncProgress: 100,
      failedSyncs: 0,
    })),
  lastSyncTime: null,
  syncProgress: 0,
  failedSyncs: 1,
  retrySync: () =>
    set((s) => {
      // Simulate retry
      return { failedSyncs: 0, syncProgress: 100, lastSyncTime: Date.now() };
    }),

  /* settings */
  settings: { voiceEnabled: true, syncOnWifiOnly: false },
  updateSettings: (s) =>
    set((state) => ({ settings: { ...state.settings, ...s } })),

  /* demo */
  isDemo: new URLSearchParams(window.location.search).has("demo"),
  setDemo: (v) => set({ isDemo: v }),
}));
