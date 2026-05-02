import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, AlertTriangle, Save, Pencil, User, Calendar, Activity, Baby } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore, type Patient } from "@/lib/store";
import { toast } from "sonner";
import MicButton from "@/components/MicButton";
import VoiceTranscript from "@/components/VoiceTranscript";

type Phase = "idle" | "listening" | "processing" | "result";

export default function VoiceEntry() {
  const t = useT();
  const nav = useNavigate();
  const addPatient = useStore((s) => s.addPatient);
  const isDemo = useStore((s) => s.isDemo);
  const [searchParams] = useSearchParams();
  const formTitle = searchParams.get("title") || t.newVisit;
  
  const [phase, setPhase] = useState<Phase>("idle");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);

  const startListening = () => {
    setRecording(true);
    setPhase("listening");
  };

  const stopListening = () => {
    setRecording(false);
    setPhase("processing");
    const demoText = isDemo
      ? "Lakshmi, 27 saal, 7 mahine pregnant, pair mein sujan, BP 145 by 92"
      : "Lakshmi, 7 months pregnant, swelling in legs";
    setTranscript(demoText);
    setTimeout(() => {
      const mock: Patient = {
        id: `p_${Date.now()}`, name: "Lakshmi", age: "27",
        pregnancyMonth: "7", pregnancyWeek: 30, village: "Mandya",
        lmp: "2025-10-01", edd: "2026-07-08",
        symptoms: "Swelling in legs, mild fatigue", risk: "high",
        recommendation: "High-risk pregnancy detected. Refer to nearest PHC within 24 hours.",
        createdAt: Date.now(), lastVisit: Date.now(), synced: false,
        dueItems: [{ type: "followup", label: "High-risk follow-up", dueDate: Date.now() }],
      };
      setPatient(mock);
      setPhase("result");
    }, 1600);
  };

  const save = () => {
    if (!patient) return;
    addPatient(patient);
    toast.success(t.saved, { className: "font-semibold" });
    if (patient.risk === "high") {
      nav("/high-risk-alert", { state: { patientId: patient.id } });
    } else {
      nav("/home");
    }
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-6 pattern-organic relative">
      <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap">
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>

      <div className="mt-6 text-center">
        <h1 className="text-3xl font-display text-primary">{formTitle}</h1>
        <p className="text-muted-foreground text-sm mt-1">Speak details to record</p>
      </div>

      {/* Mic area */}
      <div className="mt-8 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {phase !== "result" && (
            <motion.div key="mic" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}>
              <MicButton recording={recording} onStart={startListening} onStop={stopListening} size={160} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform */}
        {phase === "listening" && (
          <div className="flex items-end gap-1 h-8 mt-4">
            {[0,1,2,3,4,5,6].map((i) => (
              <motion.span key={i} className="w-1.5 bg-primary rounded-full"
                animate={{ height: ["20%","100%","30%","80%","20%"] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08 }}
                style={{ height: 32 }} />
            ))}
          </div>
        )}

        {/* Status */}
        <div className="h-12 mt-4 flex items-center justify-center">
          {phase === "processing" && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent font-bold text-lg">
              <Sparkles className="inline w-5 h-5 mr-1" /> AI analyzing...
            </motion.p>
          )}
        </div>

        {/* Transcript */}
        {transcript && phase !== "idle" && (
          <div className="w-full mt-2"><VoiceTranscript text={transcript} /></div>
        )}

        {phase === "idle" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-xs text-muted-foreground text-center max-w-xs italic mt-4">{t.example}</motion.p>
        )}
      </div>

      {/* Result cards */}
      <AnimatePresence>
        {phase === "result" && patient && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-foreground">{t.extracted}</h3>
              <button className="ml-auto text-xs text-primary font-semibold flex items-center gap-1 min-tap">
                <Pencil className="w-3 h-3" /> {t.edit}
              </button>
            </div>
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }} className="space-y-3">
              <Field icon={User} label={t.name} value={patient.name} />
              <Field icon={Calendar} label={t.age} value={`${patient.age} years`} />
              {patient.pregnancyMonth && <Field icon={Baby} label={t.pregnancy} value={`${patient.pregnancyMonth} ${t.months}`} />}
              <Field icon={Activity} label={t.symptoms} value={patient.symptoms} />

              {/* AI Recommendation */}
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="rounded-3xl p-5 bg-destructive/10 border-2 border-destructive/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-2xl" />
                <div className="flex items-center gap-2 relative">
                  <div className="w-10 h-10 rounded-2xl bg-destructive text-destructive-foreground flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-bold text-destructive">{t.aiRec}</div>
                    <div className="text-xs text-muted-foreground">High Risk</div>
                  </div>
                </div>
                <p className="mt-3 text-foreground font-semibold leading-snug relative">{patient.recommendation}</p>
              </motion.div>

              <motion.button variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                whileTap={{ scale: 0.97 }} onClick={save}
                className="w-full bg-gradient-primary text-primary-foreground py-5 rounded-3xl font-bold text-lg shadow-mic flex items-center justify-center gap-2 min-tap">
                <Save className="w-5 h-5" /> {t.save}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="glass-card p-4 flex items-center gap-3">
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
