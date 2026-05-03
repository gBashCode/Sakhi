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

  const [phase, setPhase]           = useState<Phase>("idle");
  const [qIndex, setQIndex]         = useState(-1);
  const [recording, setRecording]   = useState(false);
  const [transcript, setTranscript] = useState("");
  const [medicalData, setMedicalData] = useState<any>({
    patient_name: null, age: null, bp_sys: null, bp_dia: null, weight_kg: null, symptoms: [],
  });
  const [finalPatient, setFinalPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm]         = useState<any>(null);
  const modelLoading = getModelStatus() === "loading";

  const medRef = useRef(medicalData);
  useEffect(() => { medRef.current = medicalData; }, [medicalData]);

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
      setQIndex((prev) => prev + 1);
    }
  };

  const filterByField = (parsed: any, field: string) => {
    switch (field) {
      case "name":
        return { patient_name: parsed.patient_name || parsed.raw_text.trim() };
      case "age":
        let ageVal = parsed.age;
        if (!ageVal) {
          const m = parsed.raw_text.match(/\d+/);
          if (m) ageVal = m[0];
        }
        return { age: ageVal };
      case "bp":
        let sys = parsed.bp_sys, dia = parsed.bp_dia;
        if (!sys || !dia) {
          const m = parsed.raw_text.match(/(\d{2,3})\D+(\d{2,3})/);
          if (m) { sys = m[1]; dia = m[2]; }
        }
        return { bp_sys: sys, bp_dia: dia };
      case "weight":
        let w = parsed.weight_kg;
        if (!w) {
          const m = parsed.raw_text.match(/\d+(\.\d+)?/);
          if (m) w = m[0];
        }
        return { weight_kg: w };
      case "symptoms":
        return { symptoms: parsed.symptoms?.length > 0 ? parsed.symptoms : (parsed.raw_text.trim() ? [parsed.raw_text.trim()] : []) };
      default:
        return parsed;
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
    setEditForm({
      name: newPatient.name,
      age: newPatient.age,
      bp: md.bp_sys && md.bp_dia ? `${md.bp_sys}/${md.bp_dia}` : "N/A",
      weight: md.weight_kg ? String(md.weight_kg) : "N/A",
      symptoms: newPatient.symptoms,
      recommendation: newPatient.recommendation,
    });
    setPhase("result");
  };

  const startFlow = () => {
    setMedicalData({ patient_name: null, age: null, bp_sys: null, bp_dia: null, weight_kg: null, symptoms: [] });
    setFinalPatient(null);
    setEditForm(null);
    setTranscript("");
    setQIndex(0);
  };

  const save = () => {
    if (!finalPatient || !editForm) return;
    const updated: Patient = {
      ...finalPatient,
      name: editForm.name,
      age: editForm.age,
      symptoms: editForm.symptoms,
      recommendation: editForm.recommendation,
    };
    addPatient(updated);
    toast.success(t.saved);
    nav(updated.risk === "high" ? "/high-risk-alert" : "/home", {
      state: { patientId: updated.id },
    });
  };

  const downloadPDF = async () => {
    if (!editForm || !finalPatient) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const date = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // Header bar
    doc.setFillColor(0, 128, 96);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Sakhi AI — Patient Visit Report", 14, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${date}`, 14, 24);

    // Patient Details section
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Details", 14, 44);
    doc.setDrawColor(0, 128, 96);
    doc.line(14, 46, 196, 46);

    const fields: [string, string][] = [
      ["Name",           editForm.name],
      ["Age",            `${editForm.age} years`],
      ["Blood Pressure", editForm.bp],
      ["Weight",         `${editForm.weight} kg`],
      ["Symptoms",       editForm.symptoms],
    ];

    doc.setFontSize(11);
    let y = 54;
    fields.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(label, 14, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(String(value), 130);
      doc.text(lines, 70, y);
      y += 8 * lines.length;
    });

    // AI Recommendation section
    y += 6;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("AI Recommendation", 14, y);
    doc.setDrawColor(0, 128, 96);
    doc.line(14, y + 2, 196, y + 2);
    y += 10;

    // Risk badge
    const isHigh = finalPatient.risk === "high";
    doc.setFillColor(isHigh ? 220 : 5, isHigh ? 38 : 150, isHigh ? 38 : 105);
    doc.roundedRect(14, y - 5, 42, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Risk: ${(finalPatient.risk || "low").toUpperCase()}`, 16, y + 0.5);

    y += 10;
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const recLines = doc.splitTextToSize(editForm.recommendation, 176);
    doc.text(recLines, 14, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("Sakhi AI — Empowering ASHA Workers with Offline AI", 14, 285);
    doc.text(`Visit ID: ${finalPatient.id}`, 196, 285, { align: "right" });

    doc.save(`Sakhi_Visit_${editForm.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
    toast.success("PDF downloaded!");
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
          </div>
        )}

        {/* RESULT — Editable Form + PDF Download */}
        <AnimatePresence>
          {phase === "result" && finalPatient && editForm && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full pb-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-bold text-foreground">Visit Summary</h3>
                <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Tap any field to edit
                </span>
              </div>

              <div className="space-y-3">
                <EditField icon={User}     label="Name"                  value={editForm.name}
                  onChange={(v) => setEditForm((f: any) => ({ ...f, name: v }))} />
                <EditField icon={Calendar} label="Age (years)"           value={editForm.age}
                  onChange={(v) => setEditForm((f: any) => ({ ...f, age: v }))} inputType="number" />
                <EditField icon={Activity} label="Blood Pressure (sys/dia)" value={editForm.bp}
                  onChange={(v) => setEditForm((f: any) => ({ ...f, bp: v }))} placeholder="e.g. 120/80" />
                <EditField icon={Activity} label="Weight (kg)"           value={editForm.weight}
                  onChange={(v) => setEditForm((f: any) => ({ ...f, weight: v }))} inputType="number" />
                <EditField icon={Activity} label="Symptoms"              value={editForm.symptoms}
                  onChange={(v) => setEditForm((f: any) => ({ ...f, symptoms: v }))} multiline />

                {/* AI Recommendation */}
                <div className={`rounded-3xl p-5 border-2 ${
                  finalPatient.risk === "high"
                    ? "bg-destructive/10 border-destructive/30"
                    : "bg-emerald-50 border-emerald-200"
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-xs uppercase tracking-wider">AI Recommendation</div>
                    <button
                      onClick={() => speakRegional(editForm.recommendation, langCode)}
                      className="flex items-center gap-1 text-[10px] bg-white px-2 py-1 rounded-full border shadow-sm font-bold active:scale-95"
                    >
                      <Volume2 className="w-3 h-3" /> Dobara Suno
                    </button>
                  </div>
                  <textarea
                    value={editForm.recommendation}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, recommendation: e.target.value }))}
                    rows={3}
                    className="w-full bg-transparent font-semibold text-sm resize-none outline-none border-b border-dashed border-current/30 focus:border-current pb-1"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button onClick={downloadPDF}
                    className="w-full border-2 border-primary text-primary py-4 rounded-3xl font-bold text-sm shadow flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    ⬇ Download PDF
                  </button>
                  <button onClick={save}
                    className="w-full bg-primary text-white py-4 rounded-3xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <Save className="w-4 h-4" /> Save Visit
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EditField({
  icon: Icon, label, value, onChange, inputType = "text", placeholder, multiline = false,
}: {
  icon: any; label: string; value: string; onChange: (v: string) => void;
  inputType?: string; placeholder?: string; multiline?: boolean;
}) {
  return (
    <div className="glass-card p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{label}</div>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            placeholder={placeholder}
            className="w-full font-bold text-foreground bg-transparent resize-none outline-none border-b border-dashed border-muted-foreground/30 focus:border-primary pb-0.5 text-sm"
          />
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full font-bold text-foreground bg-transparent outline-none border-b border-dashed border-muted-foreground/30 focus:border-primary pb-0.5 text-sm"
          />
        )}
      </div>
    </div>
  );
}
