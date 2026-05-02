import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, ArrowLeft, Sparkles, AlertTriangle, Save, Pencil, User, Calendar, Activity, Baby } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore, type Patient } from "@/lib/store";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { api } from "@/lib/api";

/** Push all unsynced visits to the backend, mark them synced on success. */
async function syncToServer() {
  try {
    const unsynced = await db.visits.where('synced').equals(0).toArray();
    if (unsynced.length === 0) return;
    await api.post('/api/v1/sync', { visits: unsynced });
    await db.visits.where('synced').equals(0).modify({ synced: 1 });
  } catch (err) {
    console.warn('[SakhiAI] Background sync failed (will retry later):', err);
  }
}

type Phase = "idle" | "listening" | "processing" | "result";

export default function VoiceEntry() {
  const t = useT();
  const nav = useNavigate();
  const addPatient = useStore((s) => s.addPatient);
  const [phase, setPhase] = useState<Phase>("idle");
  const [patient, setPatient] = useState<Patient | null>(null);

  const startListening = () => {
    setPhase("listening");
    setTimeout(() => {
      setPhase("processing");
      setTimeout(() => {
        const mock: Patient = {
          id: `p_${Date.now()}`,
          name: "Lakshmi",
          age: "27",
          pregnancyMonth: "7",
          symptoms: "Swelling in legs, mild fatigue",
          risk: "high",
          recommendation: "High-risk pregnancy detected. Refer to nearest PHC within 24 hours.",
          createdAt: Date.now(),
          synced: false,
        };
        setPatient(mock);
        setPhase("result");
      }, 1600);
    }, 2400);
  };

  const save = async () => {
    if (!patient) return;

    // 1. Always write to IndexedDB first — works completely offline
    await db.visits.add({
      clientId: crypto.randomUUID(),
      patientId: patient.id,
      bpSys: undefined,
      riskLevel: patient.risk,
      deviceTs: Date.now(),
      synced: 0,
      // carry full patient snapshot for display
      name: patient.name,
      age: patient.age,
      pregnancyMonth: patient.pregnancyMonth,
      symptoms: patient.symptoms,
      recommendation: patient.recommendation,
    });

    // 2. Also update the in-memory store so the UI refreshes
    addPatient(patient);

    // 3. Try to sync to backend only if online (fire-and-forget)
    if (navigator.onLine) syncToServer();

    const isHighRisk = patient.risk === "high";
    toast.success(
      navigator.onLine ? t.saved : `${t.saved} (offline — will sync later)`,
      { className: "font-semibold" }
    );
    nav(isHighRisk ? "/alert" : "/home");
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-10 pattern-organic relative">
      <button
        onClick={() => nav(-1)}
        className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>

      <div className="mt-8 text-center">
        <h1 className="text-3xl font-display text-primary">{t.newVisit}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.speakNow}</p>
      </div>

      {/* Mic / waveform area */}
      <div className="mt-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {phase !== "result" && (
            <motion.div
              key="mic"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="relative"
            >
              {/* halos */}
              {phase === "listening" && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary-glow/40 blur-2xl"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -inset-6 rounded-full border-2 border-primary/40"
                    animate={{ scale: [1, 1.3], opacity: [0.7, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -inset-12 rounded-full border-2 border-primary/30"
                    animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                  />
                </>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={phase === "idle" ? startListening : undefined}
                className={`relative w-44 h-44 rounded-full bg-gradient-mic shadow-mic flex items-center justify-center ${
                  phase === "listening" ? "animate-mic-pulse" : ""
                }`}
              >
                {phase === "processing" ? (
                  <Sparkles className="w-16 h-16 text-primary-foreground animate-pulse" />
                ) : (
                  <Mic className="w-16 h-16 text-primary-foreground" strokeWidth={2.2} />
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status text + waveform */}
        <div className="h-16 mt-8 flex items-center justify-center">
          {phase === "idle" && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-foreground font-bold text-lg">
              {t.tapToSpeak}
            </motion.p>
          )}
          {phase === "listening" && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-primary font-bold text-lg">{t.listening}</p>
              <div className="flex items-end gap-1 h-8">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 bg-primary rounded-full"
                    animate={{ height: ["20%", "100%", "30%", "80%", "20%"] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08 }}
                    style={{ height: 32 }}
                  />
                ))}
              </div>
            </div>
          )}
          {phase === "processing" && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent font-bold text-lg">
              <Sparkles className="inline w-5 h-5 mr-1" /> AI analyzing...
            </motion.p>
          )}
        </div>

        {phase === "idle" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-muted-foreground text-center max-w-xs italic"
          >
            {t.example}
          </motion.p>
        )}
      </div>

      {/* Result cards */}
      <AnimatePresence>
        {phase === "result" && patient && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-foreground">{t.extracted}</h3>
              <button className="ml-auto text-xs text-primary font-semibold flex items-center gap-1">
                <Pencil className="w-3 h-3" /> {t.edit}
              </button>
            </div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.07 } } }}
              className="space-y-3"
            >
              <Field icon={User} label={t.name} value={patient.name} delay={0} />
              <Field icon={Calendar} label={t.age} value={`${patient.age} years`} delay={0.05} />
              {patient.pregnancyMonth && (
                <Field icon={Baby} label={t.pregnancy} value={`${patient.pregnancyMonth} ${t.months}`} delay={0.1} />
              )}
              <Field icon={Activity} label={t.symptoms} value={patient.symptoms} delay={0.15} />

              {/* AI Recommendation */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="rounded-3xl p-5 bg-destructive/10 border-2 border-destructive/30 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-2xl" />
                <div className="flex items-center gap-2 relative">
                  <div className="w-10 h-10 rounded-2xl bg-destructive text-destructive-foreground flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-bold text-destructive">
                      {t.aiRec}
                    </div>
                    <div className="text-xs text-muted-foreground">High Risk</div>
                  </div>
                </div>
                <p className="mt-3 text-foreground font-semibold leading-snug relative">
                  {patient.recommendation}
                </p>
              </motion.div>

              <motion.button
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                whileTap={{ scale: 0.97 }}
                onClick={save}
                className="w-full h-14 bg-gradient-primary text-primary-foreground rounded-3xl font-bold text-lg shadow-mic flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {t.save}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ icon: Icon, label, value, delay }: { icon: any; label: string; value: string; delay: number }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      transition={{ delay }}
      className="glass-card p-4 flex items-center gap-3"
    >
      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{label}</div>
        <div className="font-bold text-foreground truncate">{value}</div>
      </div>
    </motion.div>
  );
}
