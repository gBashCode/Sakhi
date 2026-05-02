import { create } from "zustand";
import type { Lang } from "./i18n";

export type Patient = {
  id: string;
  name: string;
  age: string;
  pregnancyMonth?: string;
  symptoms: string;
  vaccination?: string;
  risk: "low" | "medium" | "high";
  recommendation: string;
  createdAt: number;
  synced: boolean;
};

type Store = {
  lang: Lang;
  setLang: (l: Lang) => void;
  loggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
  patients: Patient[];
  setPatients: (ps: Patient[]) => void;
  addPatient: (p: Patient) => void;
  syncAll: () => void;
};

const initial: Patient[] = [
  {
    id: "p1",
    name: "Sunita Devi",
    age: "26",
    pregnancyMonth: "8",
    symptoms: "Headache, mild fever",
    risk: "high",
    recommendation: "Refer to PHC within 24 hours",
    createdAt: Date.now() - 86400000,
    synced: false,
  },
  {
    id: "p2",
    name: "Baby Arjun",
    age: "0.5",
    vaccination: "DPT-2 due in 3 days",
    symptoms: "Healthy",
    risk: "low",
    recommendation: "Schedule DPT-2 vaccine visit",
    createdAt: Date.now() - 3600000,
    synced: false,
  },
  {
    id: "p3",
    name: "Meena Kumari",
    age: "29",
    pregnancyMonth: "5",
    symptoms: "Routine ANC visit",
    risk: "low",
    recommendation: "Continue iron + folic acid",
    createdAt: Date.now() - 7200000,
    synced: false,
  },
];

export const useStore = create<Store>((set) => ({
  lang: (localStorage.getItem("ss_lang") as Lang) || "en",
  setLang: (l) => {
    localStorage.setItem("ss_lang", l);
    set({ lang: l });
  },
  loggedIn: false,
  setLoggedIn: (v) => set({ loggedIn: v }),
  patients: initial, // replaced at runtime by IndexedDB data
  setPatients: (ps) => set({ patients: ps }),
  addPatient: (p) => set((s) => ({ patients: [p, ...s.patients] })),
  syncAll: () => set((s) => ({ patients: s.patients.map((p) => ({ ...p, synced: true })) })),
}));
