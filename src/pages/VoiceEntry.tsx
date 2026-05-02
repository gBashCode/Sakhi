import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Save, User, Calendar, Activity, Volume2 } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore, type Patient } from "@/lib/store";
import { toast } from "sonner";
import VoiceTranscript from "@/components/VoiceTranscript";
import { speakRegional } from "@/agents/ttsAgent";
import { transcribeRegional, getModelStatus } from "@/agents/sttAgent";
import { parseMedical } from "@/agents/nerAgent";
import { triageRisk } from "@/agents/riskAgent";
import { getNextAction } from "@/agents/copilotAgent";

type Phase = "idle" | "speaking" | "listening" | "processing" | "result";

const QUESTIONS_MAP: Record<string, { field: string; text: string; label: string }[]> = {
  hi: [
    { field: "name",     text: "मरीज़ का नाम क्या है?",                        label: "Name" },
    { field: "age",      text: "उनकी उम्र कितनी है?",                           label: "Age" },
    { field: "bp",       text: "बीपी कितना है? जैसे 120 और 80",                label: "Blood Pressure" },
    { field: "weight",   text: "वजन कितना किलो है?",                            label: "Weight" },
    { field: "symptoms", text: "क्या कोई लक्षण हैं जैसे सूजन या सिरदर्द?",   label: "Symptoms" },
  ],
  en: [
    { field: "name",     text: "What is the patient's name?",          label: "Name" },
    { field: "age",      text: "How old are they?",                    label: "Age" },
    { field: "bp",       text: "What is the BP? e.g. 120 and 80",     label: "Blood Pressure" },
    { field: "weight",   text: "What is the weight in kg?",            label: "Weight" },
    { field: "symptoms", text: "Any symptoms like swelling or headache?", label: "Symptoms" },
  ],
  kn: [
    { field: "name",     text: "ರೋಗಿಯ ಹೆಸರೇನು?",                                     label: "Name" },
    { field: "age",      text: "ಅವರ ವಯಸ್ಸು ಎಷ್ಟು?",                                label: "Age" },
    { field: "bp",       text: "BP ಎಷ್ಟು? ಉದಾಹರಣೆಗೆ 120 ಮತ್ತು 80",               label: "Blood Pressure" },
    { field: "weight",   text: "ತೂಕ ಎಷ್ಟು ಕೆಜಿ?",                                 label: "Weight" },
    { field: "symptoms", text: "ಊತ ಅಥವಾ ತಲೆನೋವಿನಂತಹ ಯಾವುದೇ ಲಕ್ಷಣಗಳಿವೆಯೇ?",  label: "Symptoms" },
  ],
};

export default function VoiceEntry() {
  const t = useT();
  const nav = useNavigate();
  const lang = useStore((s) => s.lang);
  const langCode = lang === "kn" ? "kn-IN" : lang === "en" ? "en-US" : "hi-IN";
  const addPatient = useStore((s) => s.addPatient);

  const QUESTIONS = QUESTIONS_MAP[lang] || QUESTIONS_MAP.hi;

  const [phase, setPhase]         = useState<Phase>("idle");
  const [qIndex, setQIndex]       = useState(-1);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [medicalData, setMedicalData] = useState<any>({
    patient_name: null, age: null, bp_sys: null, bp_dia: null, weight_kg: null, symptoms: [],
  });
  const [finalPatient, setFinalPatient] = useState<Patient | null>(null);
  const modelLoading = getModelStatus() === "loading";

  // Ref to avoid stale closures in buildResult
  const medRef = useRef(medicalData);
  useEffect(() => { medRef.current = medicalData; }, [medicalData]);

  // Trigger question flow when qIndex changes
  useEffect(() => {
    if (qIndex < 0) return;
    if (qIndex < QUESTIONS.length) {
      runQuestion(qIndex);
    } else {
      buildResult();
    }
  }, [qIndex]);

  const runQuestion = async (index: number) => {
    const q = QUESTIONS[index];
    setPhase("speaking");
    setTranscript("");
    speakRegional(q.text, langCode);

    // Wait for TTS (estimate by char count)
    const waitMs = Math.max(1500, q.text.length * 60);
    await new Promise((r) => setTimeout(r, waitMs));

    setPhase("listening");
    setRecording(true);
    try {
      const text = await transcribeRegional(langCode);
      setRecording(false);
      setTranscript(text || "");
      setPhase("processing");

      if (text) {
        const parsed = parseMedical(text);
        setMedicalData((prev: any) => ({ ...prev, ...filterByField(parsed, q.field) }));
      }

      await new Promise((r) => setTimeout(r, 900));
      setQIndex((prev) => prev + 1);
    } catch (e) {
      setRecording(false);
      console.error("STT error:", e);
      setQIndex((prev) => prev + 1); // skip on error
    }
  };

  const filterByField = (parsed: any, field: string) => {
    switch (field) {
      case "name":     return { patient_name: parsed.patient_name };
      case "age":      return { age: parsed.age };
      case "bp":       return { bp_sys: parsed.bp_sys, bp_dia: parsed.bp_dia };
      case "weight":   return { weight_kg: parsed.weight_kg };
      case "symptoms": return { symptoms: parsed.symptoms };
      default:         return parsed;
    }
  };

  const buildResult = () => {
    const md = medRef.current;
    const risk = triageRisk({ ...md, age: md.age ? parseInt(md.age) : null });
    const action = getNextAction({ ifaGiven: false }, { weight_kg: md.weight_kg }, risk, lang);

    speakRegional(action, langCode);

    const newPatient: Patient = {
      id: `p_${Date.now()}`,
      name: md.patient_name || "Unknown",
      age: md.age || "N/A",
      symptoms: (md.symptoms || []).join(", ") || "None",
      risk: risk.level as any,
      recommendation: action,
      createdAt: Date.now(),
      lastVisit: Date.now(),
      synced: false,
      dueItems: [],
    };

    setFinalPatient(newPatient);
    setPhase("result");
  };

  const startFlow = () => {
    setMedicalData({ patient_name: null, age: null, bp_sys: null, bp_dia: null, weight_kg: null, symptoms: [] });
    setFinalPatient(null);
    setTranscript("");
    setQIndex(0);
  };

  const save = () => {
    if (!finalPatient) return;
    addPatient(finalPatient);
    toast.success(t.saved);
    nav(finalPatient.risk === "high" ? "/high-risk-alert" : "/home", {
      state: { patientId: finalPatient.id },
    });
  };

  const progressLabel =
    qIndex >= 0 && qIndex < QUESTIONS.length ? `${qIndex + 1} / ${QUESTIONS.length}` : null;

  return (
    <div className="min-h-screen pb-32 px-5 pt-6 pattern-organic relative">
      <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap">
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>

      <div className="mt-6 text-center">
        <h1 className="text-3xl font-display text-primary">Guided AI Visit</h1>
        <p className="text-muted-foreground text-sm mt-1">AI will ask questions one by one</p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-6">

        {/* IDLE */}
        {phase === "idle" && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={startFlow}
            className="w-full max-w-xs bg-primary text-white py-6 rounded-3xl font-bold text-xl shadow-lg flex items-center justify-center gap-3"
          >
            <Sparkles className="w-6 h-6" /> Start Guided Visit
          </motion.button>
        )}

        {/* ACTIVE PHASES */}
        {phase !== "idle" && phase !== "result" && (
          <div className="flex flex-col items-center gap-6 w-full">
            {progressLabel && (
              <div className="text-xs font-bold text-muted-foreground tracking-widest">
                QUESTION {progressLabel}
              </div>
            )}

            <div className="glass-card p-6 w-full text-center border-2 border-primary/20">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {QUESTIONS[qIndex]?.label}
              </span>
              <h2 className="text-2xl font-bold mt-2 text-foreground">
                {QUESTIONS[qIndex]?.text}
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {phase === "speaking" ? (
                <motion.div key="speaking" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center animate-pulse">
                    <Volume2 className="w-12 h-12 text-accent" />
                  </div>
                  <p className="text-sm text-muted-foreground">Sakhi bol rahi hai...</p>
                </motion.div>
              ) : phase === "listening" ? (
                <motion.div key="listening" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center animate-pulse">
                    <span className="text-5xl">🎙️</span>
                  </div>
                  <p className="text-base font-bold text-primary">Boliye...</p>
                  {modelLoading && (
                    <p className="text-sm text-accent font-bold animate-pulse bg-accent/10 px-4 py-2 rounded-2xl">
                      AI load ho raha hai, thoda wait karein...
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map((d) => (
                      <div key={d} className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-primary animate-pulse">Sakhi AI soch rahi hai...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {transcript && (
              <div className="w-full max-w-sm">
                <VoiceTranscript text={transcript} />
              </div>
            )}

            {/* FALLBACK: KEYBOARD VOICE TYPING */}
            <div className="mt-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Problem with AI? Use Phone Mic:</p>
              <button
                onClick={() => {
                  const input = document.getElementById('keyboard-fallback') as HTMLTextAreaElement;
                  input.focus();
                }}
                className="bg-secondary/50 border border-border px-4 py-2 rounded-2xl text-xs font-bold text-foreground flex items-center gap-2 mx-auto"
              >
                <Mic className="w-3 h-3" /> Tap to use Keyboard Mic
              </button>
              <textarea
                id="keyboard-fallback"
                className="opacity-0 h-0 w-0 absolute overflow-hidden"
                placeholder="Talk to your keyboard mic..."
                onChange={(e) => {
                  setTranscript(e.target.value);
                  // Auto-submit after 2s of no typing
                }}
                onBlur={() => {
                  if (transcript) {
                    const parsed = parseMedical(transcript);
                    setMedicalData((prev: any) => ({ ...prev, ...filterByField(parsed, QUESTIONS[qIndex].field) }));
                    setTimeout(() => setQIndex(prev => prev + 1), 500);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* RESULT */}
        <AnimatePresence>
          {phase === "result" && finalPatient && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full pb-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-bold text-foreground">Visit Summary</h3>
              </div>
              <div className="space-y-3">
                <Field icon={User}     label="Name"     value={finalPatient.name} />
                <Field icon={Calendar} label="Age"      value={`${finalPatient.age} years`} />
                <Field icon={Activity} label="Symptoms" value={finalPatient.symptoms || "None"} />

                <div className={`rounded-3xl p-5 border-2 ${
                  finalPatient.risk === "high"
                    ? "bg-destructive/10 border-destructive/30"
                    : "bg-emerald-50 border-emerald-200"
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-xs uppercase tracking-wider">AI Recommendation</div>
                    <button
                      onClick={() => speakRegional(finalPatient.recommendation, langCode)}
                      className="flex items-center gap-1 text-[10px] bg-white px-2 py-1 rounded-full border shadow-sm font-bold active:scale-95"
                    >
                      <Volume2 className="w-3 h-3" /> Dobara Suno
                    </button>
                  </div>
                  <p className="font-semibold text-sm">{finalPatient.recommendation}</p>
                </div>

                <button onClick={save}
                  className="w-full bg-primary text-white py-5 rounded-3xl font-bold text-lg shadow-xl flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> Save Visit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
