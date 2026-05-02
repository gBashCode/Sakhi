import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, AlertTriangle, Save, Pencil, User, Calendar, Activity, Baby, Syringe, ClipboardList, Home } from "lucide-react";
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
  
  const formType = searchParams.get("type") || "maternal";
  const formTitle = searchParams.get("title") || t.newVisit;
  
  const [phase, setPhase] = useState<Phase>("idle");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [extractedFields, setExtractedFields] = useState<{icon: any, label: string, value: string}[]>([]);

  const startListening = () => {
    setRecording(true);
    setPhase("listening");
  };

  const getMockData = (type: string) => {
    const baseFields = { id: `p_${Date.now()}`, createdAt: Date.now(), lastVisit: Date.now(), synced: false };
    
    switch(type) {
      case "demographic":
        return {
          text: "Ramesh Kumar ka parivar, SC category, BPL card hai, 5 sadasya hain.",
          patient: { ...baseFields, name: "Ramesh Kumar (Household)", age: "45", symptoms: "Household: 5 members, BPL, SC Category", risk: "low" as const, recommendation: "Ensure all members are registered for Ayushman Bharat" },
          fields: [
            { icon: User, label: "Head of Family", value: "Ramesh Kumar" },
            { icon: Activity, label: "Status", value: "BPL, SC" },
            { icon: Home, label: "Members", value: "5" }
          ]
        };
      case "child":
        return {
          text: "Rahul, 6 mahine ka, polio drop de di gayi hai, weight 6 kg.",
          patient: { ...baseFields, name: "Rahul", age: "0.5", symptoms: "Healthy, Weight: 6kg", risk: "low" as const, vaccination: "Polio drop given", recommendation: "Next vaccination (Measles) due at 9 months." },
          fields: [
            { icon: Baby, label: "Child Name", value: "Rahul (6 months)" },
            { icon: Syringe, label: "Immunization", value: "Polio OPV" },
            { icon: Activity, label: "Weight", value: "6.0 kg" }
          ]
        };
      case "disease":
        return {
          text: "Suresh ko 3 din se tez bukhar hai aur thodi khansi bhi hai.",
          patient: { ...baseFields, name: "Suresh", age: "34", symptoms: "High fever for 3 days, mild cough", risk: "medium" as const, recommendation: "Provide Paracetamol. If fever persists >5 days, refer for Malaria/Dengue test." },
          fields: [
            { icon: User, label: "Patient", value: "Suresh" },
            { icon: Activity, label: "Symptoms", value: "Fever (3 days), Cough" },
            { icon: AlertTriangle, label: "Suspected", value: "Viral / Malaria" }
          ]
        };
      case "ncd":
        return {
          text: "Kamla, BP 150 by 95, unko dawai lene ke liye bola hai.",
          patient: { ...baseFields, name: "Kamla", age: "55", symptoms: "Hypertension screening: BP 150/95", risk: "medium" as const, recommendation: "Hypertension detected. Start lifestyle counseling, schedule NCD clinic visit." },
          fields: [
            { icon: User, label: "Patient", value: "Kamla" },
            { icon: Activity, label: "Screening", value: "BP: 150/95" },
            { icon: AlertTriangle, label: "Diagnosis", value: "Hypertension Alert" }
          ]
        };
      case "family_planning":
        return {
          text: "Geeta, 2 bacche hain, unko Copper-T ke baare mein samjhaya.",
          patient: { ...baseFields, name: "Geeta", age: "28", symptoms: "Family Planning Counseling: Copper-T discussed", risk: "low" as const, recommendation: "Follow up in 1 month to confirm Copper-T insertion at PHC." },
          fields: [
            { icon: User, label: "Target Client", value: "Geeta" },
            { icon: Baby, label: "Living Children", value: "2" },
            { icon: ClipboardList, label: "Method", value: "Copper-T (IUCD)" }
          ]
        };
      case "maternal":
      default:
        return {
          text: "Lakshmi, 7 months pregnant, pair mein sujan, BP 145 by 92",
          patient: { 
            ...baseFields, name: "Lakshmi", age: "27", pregnancyMonth: "7", pregnancyWeek: 30, village: "Mandya", lmp: "2025-10-01", edd: "2026-07-08", symptoms: "Swelling in legs, BP 145/92", risk: "high" as const, recommendation: "High-risk pregnancy detected. Refer to nearest PHC within 24 hours.",
            dueItems: [{ type: "followup" as const, label: "High-risk follow-up", dueDate: Date.now() }],
          },
          fields: [
            { icon: User, label: "Name", value: "Lakshmi" },
            { icon: Calendar, label: "Pregnancy", value: "7 Months" },
            { icon: Activity, label: "Symptoms", value: "Leg Swelling, BP 145/92" }
          ]
        };
    }
  };

  const stopListening = () => {
    setRecording(false);
    setPhase("processing");
    
    const mockData = getMockData(formType);
    
    setTranscript(isDemo ? mockData.text : mockData.text);
    setTimeout(() => {
      setPatient(mockData.patient as Patient);
      setExtractedFields(mockData.fields);
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
      <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap shadow-sm">
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
              <Sparkles className="inline w-5 h-5 mr-1" /> AI extracting {formType} data...
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
              
              {extractedFields.map((field, idx) => (
                <Field key={idx} icon={field.icon} label={field.label} value={field.value} />
              ))}

              {/* AI Recommendation */}
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className={`rounded-3xl p-5 border-2 relative overflow-hidden ${
                  patient.risk === 'high' ? 'bg-destructive/10 border-destructive/30' : 
                  patient.risk === 'medium' ? 'bg-amber-500/10 border-amber-500/30' : 
                  'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl ${
                  patient.risk === 'high' ? 'bg-destructive/10' : 
                  patient.risk === 'medium' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                }`} />
                <div className="flex items-center gap-2 relative">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                    patient.risk === 'high' ? 'bg-destructive' : 
                    patient.risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`text-[11px] uppercase tracking-wider font-bold ${
                      patient.risk === 'high' ? 'text-destructive' : 
                      patient.risk === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{t.aiRec}</div>
                    <div className="text-xs text-muted-foreground">{patient.risk === 'high' ? 'High Risk' : patient.risk === 'medium' ? 'Follow-up Required' : 'Standard'}</div>
                  </div>
                </div>
                <p className="mt-3 text-foreground font-semibold leading-snug relative">{patient.recommendation}</p>
              </motion.div>

              <motion.button variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                whileTap={{ scale: 0.97 }} onClick={save}
                className="w-full bg-gradient-primary text-primary-foreground py-5 rounded-3xl font-bold text-lg shadow-mic flex items-center justify-center gap-2 min-tap mt-4">
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
      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500">{label}</div>
        <div className="font-bold text-slate-800 truncate">{value}</div>
      </div>
    </motion.div>
  );
}
