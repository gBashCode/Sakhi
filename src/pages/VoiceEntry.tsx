import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, AlertTriangle, Save, Pencil, User, Calendar, Activity, Baby, Volume2 } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore, type Patient } from "@/lib/store";
import { toast } from "sonner";
import MicButton from "@/components/MicButton";
import VoiceTranscript from "@/components/VoiceTranscript";

import { transcribeOnDevice } from "@/agents/sttAgent";
import { parseMedical } from "@/agents/nerAgent";
import { triageRisk } from "@/agents/riskAgent";
import { getNextAction } from "@/agents/copilotAgent";
import { useVoice } from "@/hooks/useVoice";
import { speak } from "@/agents/ttsAgent";

type Phase = "idle" | "listening" | "processing" | "result" | "speaking";

const QUESTIONS = [
  { field: "name", text: "मरीज़ का नाम क्या है?", label: "Name" },
  { field: "age", text: "उनकी उम्र कितनी है?", label: "Age" },
  { field: "bp", text: "बीपी कितना है? जैसे 120 और 80", label: "Blood Pressure" },
  { field: "weight", text: "वजन कितना किलो है?", label: "Weight" },
  { field: "symptoms", text: "क्या कोई लक्षण हैं जैसे सूजन या सिरदर्द?", label: "Symptoms" },
];

export default function VoiceEntry() {
  const t = useT();
  const nav = useNavigate();
  const lang = useStore((s) => s.lang);
  const addPatient = useStore((s) => s.addPatient);

  const [phase, setPhase] = useState<Phase>("idle");
  const [qIndex, setQIndex] = useState(-1);
  const [medicalData, setMedicalData] = useState<any>({
    name: null, age: null, bp_sys: null, bp_dia: null, weight_kg: null, symptoms: []
  });
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(1.0);
  const [finalPatient, setFinalPatient] = useState<Patient | null>(null);

  // Auto-start next question
  useEffect(() => {
    if (qIndex >= 0 && qIndex < QUESTIONS.length) {
      askQuestion(qIndex);
    } else if (qIndex === QUESTIONS.length) {
      finishProcess();
    }
  }, [qIndex]);

  const askQuestion = async (index: number) => {
    setPhase("speaking");
    const q = QUESTIONS[index];
    await speak(q.text, lang);
    setPhase("listening");
    start(); // Start listening automatically
  };

  const handleVoiceComplete = async (blob: Blob) => {
    console.log("[VoiceEntry] Blob received, size:", blob.size);
    setPhase("processing");
    try {
      const result = await transcribeOnDevice(blob);
      const text = result.text;
      setConfidence(result.confidence);

      if (!text || text.length < 2) throw new Error("Empty");

      // FAKE STREAMING FOR DEMO WOW-FACTOR
      const words = text.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(r => setTimeout(r, 80)); // 80ms per word
        setTranscript(words.slice(0, i + 1).join(' '));
      }

      const currentField = QUESTIONS[qIndex]?.field;
      const parsed = parseMedical(text, currentField as any);
      
      setMedicalData((prev: any) => ({
        ...prev,
        ...parsed,
        // Special handling for BP since it fills two fields
        ...(currentField === 'bp' && parsed.bp_sys ? { bp_sys: parsed.bp_sys, bp_dia: parsed.bp_dia } : {})
      }));

      // Move to next question after a short delay for feedback
      setTimeout(() => {
        setQIndex(prev => prev + 1);
        setTranscript("");
        setConfidence(1.0);
      }, 1500);

    } catch (err) {
      console.error("[VoiceEntry] Failed:", err);
      toast.error("I didn't hear you clearly. Let's try that again.");
      setPhase("listening");
      start(); // Restart mic for same question
    }
  };

  const { recording, start, stop, modelLoading } = useVoice(handleVoiceComplete);

  // Auto-stop timeout if user forgets to tap stop
  const autoStopRef = useRef<any>(null);
  useEffect(() => {
    if (phase === "listening") {
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      autoStopRef.current = setTimeout(() => {
        if (phase === "listening") stop();
      }, 7000); // 7 seconds per answer
    }
    return () => clearTimeout(autoStopRef.current);
  }, [phase, stop]);

  const finishProcess = () => {
    const riskCalc = triageRisk(medicalData);
    const action = getNextAction({}, {}, riskCalc);

    const newPatient: Patient = {
      id: `p_${Date.now()}`,
      name: medicalData.name || "Unknown",
      age: medicalData.age || "25",
      symptoms: medicalData.symptoms.join(", ") || "None",
      risk: riskCalc.level as any,
      recommendation: riskCalc.protocol + " " + action,
      createdAt: Date.now(),
      lastVisit: Date.now(),
      synced: false,
      dueItems: [],
    };

    setFinalPatient(newPatient);
    setPhase("result");
  };

  const startFlow = () => {
    setQIndex(0);
  };

  const save = () => {
    if (!finalPatient) return;
    addPatient(finalPatient);
    toast.success(t.saved);
    nav(finalPatient.risk === "high" ? "/high-risk-alert" : "/home", {
      state: { patientId: finalPatient.id }
    });
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-6 pattern-organic relative">
      <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap">
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>

      <div className="mt-6 text-center">
        <h1 className="text-3xl font-display text-primary">Guided AI Visit</h1>
        <p className="text-muted-foreground text-sm mt-1">AI will ask questions one by one</p>
      </div>

      <div className="mt-8 flex flex-col items-center">
        {phase === "idle" && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={startFlow}
            className="w-full max-w-xs bg-primary text-white py-6 rounded-3xl font-bold text-xl shadow-lg flex items-center justify-center gap-3"
          >
            <Sparkles className="w-6 h-6" /> Start Guided Visit
          </motion.button>
        )}

        {(phase === "listening" || phase === "speaking" || phase === "processing") && (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="glass-card p-6 w-full text-center border-2 border-primary/20">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Current Question</span>
              <h2 className="text-2xl font-bold mt-2 text-foreground">
                {QUESTIONS[qIndex]?.text}
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {phase === "speaking" ? (
                <motion.div key="speaking" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <div className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center animate-pulse">
                    <Volume2 className="w-12 h-12 text-accent" />
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <MicButton recording={recording} onStart={start} onStop={stop} size={140} disabled={modelLoading} />
                  {modelLoading && (
                    <div className="bg-accent/10 border border-accent/20 px-4 py-2 rounded-2xl animate-pulse">
                      <p className="text-sm text-accent font-bold">First time: Downloading 40MB AI. Keep internet ON.</p>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>

            {transcript && (
              <div className="w-full max-w-sm flex flex-col gap-2">
                <VoiceTranscript text={transcript} confidence={Math.round(confidence * 100)} />
                {confidence < 0.6 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-xs text-yellow-600 font-bold bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-3 h-3" /> AI not sure. Please confirm BP.
                  </motion.div>
                )}
              </div>
            )}

            {phase === "processing" && !transcript && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-bold text-primary animate-pulse">Sakhi AI soch rahi hai...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Result cards */}
      <AnimatePresence>
        {phase === "result" && finalPatient && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-foreground">Summary</h3>
            </div>
            <div className="space-y-3">
              <Field icon={User} label="Name" value={finalPatient.name} />
              <Field icon={Calendar} label="Age" value={`${finalPatient.age} years`} />
              <Field icon={Activity} label="Symptoms" value={finalPatient.symptoms} />

              <div className={`rounded-3xl p-5 border-2 ${
                finalPatient.risk === "high" ? "bg-destructive/10 border-destructive/30" : "bg-emerald-50 border-emerald-200"
              }`}>
                <div className="font-bold text-xs uppercase tracking-wider mb-1">AI Recommendation</div>
                <p className="font-semibold">{finalPatient.recommendation}</p>
              </div>

              <button onClick={save} className="w-full bg-primary text-white py-5 rounded-3xl font-bold text-lg shadow-xl flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Save Visit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-[10px] uppercase font-bold text-muted-foreground">{label}</div>
        <div className="font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}
