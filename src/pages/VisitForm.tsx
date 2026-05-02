import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Activity, Heart } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore, type Risk, type Visit } from "@/lib/store";
import MicButton from "@/components/MicButton";
import VoiceTranscript from "@/components/VoiceTranscript";
import RiskBadge from "@/components/RiskBadge";
import { toast } from "sonner";

function calcRisk(sys: number | null, dia: number | null, symp: string): Risk {
  if ((sys && sys >= 140) || (dia && dia >= 90)) return "high";
  const s = symp.toLowerCase();
  if (s.includes("swelling") || s.includes("bleeding")) return "high";
  if ((sys && sys >= 130) || (dia && dia >= 85)) return "medium";
  if (s.includes("headache") || s.includes("fever")) return "medium";
  return "low";
}

export default function VisitForm() {
  const t = useT();
  const nav = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const patient = useStore((s) => s.patients.find((p) => p.id === patientId));
  const addVisit = useStore((s) => s.addVisit);
  const updatePatient = useStore((s) => s.updatePatient);
  const isDemo = useStore((s) => s.isDemo);
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [weight, setWeight] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [risk, setRisk] = useState<Risk>("low");
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [glowField, setGlowField] = useState<string | null>(null);

  useEffect(() => {
    setRisk(calcRisk(parseInt(bpSys)||null, parseInt(bpDia)||null, symptoms));
  }, [bpSys, bpDia, symptoms]);

  useEffect(() => {
    if (glowField) { const t2 = setTimeout(() => setGlowField(null), 1500); return () => clearTimeout(t2); }
  }, [glowField]);

  const handleVoice = useCallback((text: string) => {
    setTranscript(text);
    const bp = text.match(/(?:bp)\s*(\d{2,3})\s*(?:by|\/|over)\s*(\d{2,3})/i);
    if (bp) { setBpSys(bp[1]); setBpDia(bp[2]); setGlowField("bp"); }
    else { const s = text.match(/(?:bp)\s*(\d{2,3})/i); if (s) { setBpSys(s[1]); setGlowField("bp"); } }
    const wt = text.match(/(\d{2,3})\s*(?:kg|kilo)/i); if (wt) { setWeight(wt[1]); setGlowField("weight"); }
    const kw = ["headache","fever","swelling","nausea","bleeding","pain","fatigue"];
    const found = kw.filter(k => text.toLowerCase().includes(k));
    if (found.length) { setSymptoms(p => [...new Set([...(p?p.split(", "):[]),...found])].join(", ")); setGlowField("symptoms"); }
  }, []);

  const stopRec = () => { setRecording(false); setTimeout(() => handleVoice(isDemo?"BP 150 by 95, weight 58 kg, headache and swelling":"BP 140 by 90, weight 55 kg, mild fatigue"), 600); };

  const handleSave = () => {
    const v: Visit = { id:`v_${Date.now()}`, patientId:patientId||"", bpSys:parseInt(bpSys)||null, bpDia:parseInt(bpDia)||null, weight:parseFloat(weight)||null, symptoms, risk, recommendation:risk==="high"?"Refer to PHC within 24 hours":risk==="medium"?"Monitor closely":"Normal visit", createdAt:Date.now(), synced:false };
    addVisit(v);
    if (patientId) updatePatient(patientId, { lastVisit:Date.now(), risk, synced:false });
    toast.success(t.saved);
    risk==="high" ? nav("/high-risk-alert",{state:{patientId}}) : nav(-1);
  };

  const gc = (f:string) => glowField===f ? "animate-glow-field field-glow" : "";

  return (
    <div className="min-h-screen pb-32 px-5 pt-6 pattern-organic">
      <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap mb-4">
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>
      <h1 className="text-3xl font-display text-primary">{t.visitForm}</h1>
      {patient && <p className="text-muted-foreground text-sm mt-1">{patient.name} • {patient.age} yrs</p>}

      <div className="mt-6 flex justify-center">
        <MicButton recording={recording} onStart={() => setRecording(true)} onStop={stopRec} />
      </div>
      {recording && (
        <div className="flex items-end justify-center gap-1 h-8 mt-4">
          {Array.from({length:9}).map((_,i) => (
            <motion.div key={i} className="w-1.5 bg-primary rounded-full" animate={{height:["20%","100%","30%","80%","20%"]}} transition={{duration:0.9,repeat:Infinity,delay:i*0.07}} style={{height:32}} />
          ))}
        </div>
      )}
      {transcript && <div className="mt-4"><VoiceTranscript text={transcript} /></div>}

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground">{t.riskLevel}</span>
          <RiskBadge risk={risk} size="md" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.bpSystolic}</label>
            <div className={`flex items-center gap-2 bg-card/60 rounded-2xl px-4 py-3.5 border border-border transition-all ${gc("bp")}`}>
              <Heart className="w-4 h-4 text-destructive shrink-0" />
              <input type="number" inputMode="numeric" value={bpSys} onChange={e => setBpSys(e.target.value)} placeholder="120" className="flex-1 bg-transparent outline-none text-lg font-bold text-foreground" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.bpDiastolic}</label>
            <div className={`flex items-center gap-2 bg-card/60 rounded-2xl px-4 py-3.5 border border-border transition-all ${gc("bp")}`}>
              <Heart className="w-4 h-4 text-accent shrink-0" />
              <input type="number" inputMode="numeric" value={bpDia} onChange={e => setBpDia(e.target.value)} placeholder="80" className="flex-1 bg-transparent outline-none text-lg font-bold text-foreground" />
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.weight}</label>
          <div className={`flex items-center gap-2 bg-card/60 rounded-2xl px-4 py-3.5 border border-border transition-all ${gc("weight")}`}>
            <Activity className="w-4 h-4 text-primary shrink-0" />
            <input type="number" inputMode="numeric" value={weight} onChange={e => setWeight(e.target.value)} placeholder="55" className="flex-1 bg-transparent outline-none text-lg font-bold text-foreground" />
            <span className="text-muted-foreground text-sm">kg</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.symptoms}</label>
          <div className={`bg-card/60 rounded-2xl px-4 py-3.5 border border-border transition-all ${gc("symptoms")}`}>
            <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder={t.enterSymptoms} rows={3} className="w-full bg-transparent outline-none text-foreground resize-none" />
          </div>
        </div>
      </div>
      <motion.button whileTap={{scale:0.97}} onClick={handleSave} disabled={!bpSys && !symptoms} className="mt-6 w-full bg-gradient-primary text-primary-foreground py-5 rounded-3xl font-bold text-lg shadow-mic flex items-center justify-center gap-2 min-tap disabled:opacity-50">
        <Save className="w-5 h-5" /> {t.saveVisit}
      </motion.button>
    </div>
  );
}
