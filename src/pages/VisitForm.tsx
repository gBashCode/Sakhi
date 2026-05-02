import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Activity, Heart, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore, type Risk } from "@/lib/store";
import { useVoice } from "@/hooks/useVoice";
import { db } from "@/lib/db";
import { parseMedical, calcRisk as nerCalcRisk } from "@/agents/nerAgent";
import { triageRisk } from "@/agents/riskAgent";
import { getNextAction } from "@/agents/copilotAgent";
import { transcribeOnDevice, initSTT, isModelReady } from "@/agents/sttAgent";
import { generateVisitSummary } from "@/agents/summaryAgent";
import MicButton from "@/components/MicButton";
import VoiceTranscript from "@/components/VoiceTranscript";
import RiskBadge from "@/components/RiskBadge";
import AnemiaChecker from "@/components/AnemiaChecker";
import TranslatePanel from "@/components/TranslatePanel";
import { toast } from "sonner";

// ── Risk engine — thin wrapper that delegates to nerAgent (single source of truth) ──
// Converts symptom string "edema, fever" → string[] for nerCalcRisk
function calcRisk(sys: number | null, dia: number | null, symp: string): Risk {
  const sympArr = symp ? symp.split(/,\s*/).filter(Boolean) : [];
  return nerCalcRisk(sys, dia, sympArr) as Risk;
}

export default function VisitForm() {
  const t = useT();
  const nav = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const patient = useStore((s) => s.patients.find((p) => p.id === patientId));
  const updatePatient = useStore((s) => s.updatePatient);

  // ── Local form state ──────────────────────────────────────────────────────
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [weight, setWeight] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [summary, setSummary] = useState("");
  const [risk, setRisk] = useState<Risk>("low");
  const [glowField, setGlowField] = useState<string | null>(null);
  // Triage state from riskAgent
  const [triage, setTriage] = useState<{
    level: string; reasons: string[]; protocol: string; urgency: string;
  } | null>(null);
  // Copilot: single CalmOps action string
  const [salah, setSalah] = useState<string>("");
  // Vision: anemia check result
  const [anemiaResult, setAnemiaResult] = useState<{
    risk: string; score: number; confidence: string; detail: string;
  } | null>(null);

  const [transcript, setTranscript] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [lang, setLang] = useState('hi-IN'); // 'hi-IN' or 'kn-IN'

  useEffect(() => {
    if (!isModelReady()) {
      initSTT((percent: number) => setDownloadProgress(percent));
    }
  }, []);

  // ── useVoice hook (STT -> NER -> Risk -> Copilot) ─────────────────────────
  const { recording, start, stop, result, loading: aiLoading, error: aiError, documents } = useVoice(patient, lang);

  useEffect(() => {
    if (result?.medical) {
      const { bp_sys, bp_dia, weight_kg, symptoms: sympArr } = result.medical;
      if (bp_sys) { setBpSys(String(bp_sys)); setGlowField("bp"); }
      if (bp_dia) setBpDia(String(bp_dia));
      if (weight_kg) { setWeight(String(weight_kg)); setGlowField("weight"); }
      if (sympArr?.length) { setSymptoms(sympArr.join(", ")); setGlowField("symptoms"); }
    }
    if (result?.text) setTranscript(result.text);
    if (result?.risk) { setRisk(result.risk.level as Risk); setTriage(result.risk); }
    if (result?.action) setSalah(result.action);
    if (result?.summary) setSummary(result.summary);
  }, [result]);

  // ── Risk + Triage + Copilot: recalculate on every form change ─────────────
  useEffect(() => {
    const sys = parseInt(bpSys) || null;
    const dia = parseInt(bpDia) || null;
    const sympArr = symptoms ? symptoms.split(", ").filter(Boolean) : [];
    setRisk(nerCalcRisk(sys, dia, sympArr) as Risk);
    // Run full MoHFW triage
    const wt = parseFloat(weight) || null;
    const age = patient?.age ? parseInt(patient.age) : null;
    const t2 = triageRisk({ bp_sys: sys, bp_dia: dia, weight_kg: wt, symptoms: sympArr, age });
    setTriage(t2);
    // CalmOps: compute single next action
    const visitSnapshot = { ifaGiven: false, ttDone: false, deviceTs: Date.now() };
    setSalah(getNextAction(patient ?? {}, visitSnapshot, t2));
    
    // Auto-update summary if not using voice (manual edit fallback)
    if (!aiLoading && !recording) {
      const newSummary = generateVisitSummary(patient, { 
        patient_name: patient?.name, age, bp_sys: sys, bp_dia: dia, weight_kg: wt, symptoms: sympArr 
      }, t2, lang.startsWith('kn') ? 'kn' : 'hi');
      setSummary(newSummary);
    }
  }, [bpSys, bpDia, symptoms, weight, patient, lang]);

  // ── Glow clear ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (glowField) {
      const t2 = setTimeout(() => setGlowField(null), 1500);
      return () => clearTimeout(t2);
    }
  }, [glowField]);

  // ── Save to Dexie (offline-first) then Zustand store ─────────────────────
  const handleSave = useCallback(async () => {
    const sysNum = parseInt(bpSys) || undefined;
    const diaNum = parseInt(bpDia) || undefined;
    const wtNum  = parseFloat(weight) || undefined;
    const riskLevel = calcRisk(sysNum ?? null, diaNum ?? null, symptoms);

    try {
      // 1. Persist to Dexie IndexedDB (works offline)
      await db.visits.add({
        clientId:  crypto.randomUUID(),
        patientId: patientId ?? "",
        bpSys:     sysNum,
        bpDia:     diaNum,
        weight:    wtNum,
        symptoms,
        riskLevel,
        summary,
        deviceTs:  Date.now(),
        synced:    0,
      });

      // 2. Update Zustand store (UI state)
      if (patientId) {
        updatePatient(patientId, {
          lastVisit: Date.now(),
          risk: riskLevel,
          synced: false,
        });
      }

      toast.success(t.saved);
      riskLevel === "high"
        ? nav("/high-risk-alert", { state: { patientId } })
        : nav(-1);
    } catch (err) {
      console.error("[VisitForm] Save failed:", err);
      toast.error("Could not save visit. Please try again.");
    }
  }, [bpSys, bpDia, weight, symptoms, patientId, updatePatient, nav, t.saved]);

  const downloadFile = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const gc = (f: string) => (glowField === f ? "animate-glow-field field-glow" : "");

  return (
    <div className="min-h-screen pb-32 px-5 pt-6 pattern-organic">
      {/* Back button */}
      <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap mb-4">
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>

      <h1 className="text-3xl font-display text-primary">{t.visitForm}</h1>
      {patient && <p className="text-muted-foreground text-sm mt-1">{patient.name} • {patient.age} yrs</p>}

      {downloadProgress > 0 && downloadProgress < 100 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-2xl text-xs font-bold animate-pulse">
          AI Download: {downloadProgress}% - Keep internet ON
        </div>
      )}

      {/* ── Mic Button ─────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col items-center gap-2">
        {/* Language Toggle */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setLang('hi-IN')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${lang === 'hi-IN' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            हिंदी
          </button>
          <button
            onClick={() => setLang('kn-IN')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${lang === 'kn-IN' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            ಕನ್ನಡ
          </button>
        </div>

        {/* data-action required for QA regression tests */}
        <div data-action="mic-record">
          <MicButton
            recording={recording}
            onStart={start}
            onStop={stop}
          />
        </div>
        {aiLoading && (
          <p className="text-xs text-accent font-semibold animate-pulse">
            Sakhi AI soch rahi hai...
          </p>
        )}
        {aiError && (
          <p className="text-xs text-destructive font-semibold">
            {aiError}
          </p>
        )}
        {recording && (
          <div className="flex items-end justify-center gap-1 h-8">
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-primary rounded-full"
                animate={{ height: ["20%", "100%", "30%", "80%", "20%"] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.07 }}
                style={{ height: 32 }}
              />
            ))}
          </div>
        )}
        {transcript && <div className="w-full mt-2"><VoiceTranscript text={transcript} /></div>}
      </div>

      {/* ── Auto-Filled Documents ───────────────────────────────────────── */}
      {documents && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-4 glass-card border-2 border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Documents Auto-Filled</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => downloadFile(documents.ancCardPDF, "ANC_Card.pdf")}
              className="flex items-center gap-2 bg-white p-3 rounded-2xl border shadow-sm active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">PDF</div>
              <span className="text-[10px] font-bold text-left">ANC Card</span>
            </button>
            <button
              onClick={() => downloadFile(documents.registerExcel, "RCH_Register.xlsx")}
              className="flex items-center gap-2 bg-white p-3 rounded-2xl border shadow-sm active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">XLS</div>
              <span className="text-[10px] font-bold text-left">RCH Register</span>
            </button>
            {documents.referralSlipPDF && (
              <button
                onClick={() => downloadFile(documents.referralSlipPDF, "Referral.pdf")}
                className="col-span-2 flex items-center gap-2 bg-red-50 p-3 rounded-2xl border border-red-200 shadow-sm active:scale-95 transition-transform"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white">!</div>
                <span className="text-[10px] font-bold text-red-700">Referral Slip (Emergency)</span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Anemia Check (camera pallor screening) ───────────────────── */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Optional: conjunctival/palmar pallor check</p>
        <AnemiaChecker onResult={setAnemiaResult} />
      </div>
      {anemiaResult && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="anemia-result"
          className={`rounded-2xl px-4 py-3 border mt-2 ${
            anemiaResult.risk === "anemia_risk"
              ? "bg-destructive/10 border-destructive/40 text-destructive"
              : anemiaResult.risk === "borderline"
              ? "bg-accent/10 border-accent/30 text-accent"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <div className="font-bold text-sm">
            🩸 Anemia check:{" "}
            {anemiaResult.risk === "anemia_risk" ? "Risk detected" :
             anemiaResult.risk === "borderline"  ? "Borderline" : "Normal"}
            <span className="ml-2 font-normal text-xs opacity-70">
              ({(anemiaResult.score * 100).toFixed(0)}% · {anemiaResult.confidence})
            </span>
          </div>
          <p className="text-xs mt-0.5 opacity-80">{anemiaResult.detail}</p>
        </motion.div>
      )}

      {/* ── Form fields ────────────────────────────────────────────────── */}
      <div className="mt-6 space-y-4">
        {/* Risk badge + Triage protocol banner */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground">{t.riskLevel}</span>
          <RiskBadge risk={risk} size="md" />
        </div>

        {/* Protocol banner — appears as soon as triage fires */}
        {triage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="triage-protocol"
            className={`rounded-2xl px-4 py-3 flex items-start gap-3 border ${
              triage.level === "high"
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : triage.level === "medium"
                ? "bg-accent/10 border-accent/30 text-accent"
                : "bg-primary/10 border-primary/20 text-primary"
            }`}
          >
            {triage.level === "high" ? (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight">{triage.protocol}</div>
              <div className="text-xs mt-0.5 opacity-80">
                {triage.reasons.join(" · ")}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Sakhi Salah — CalmOps single action card ────────────────── */}
        {salah && (
          <motion.div
            key={salah}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            data-testid="sakhi-salah"
            className={`rounded-3xl px-5 py-4 border-2 ${
              triage?.level === "high"
                ? "bg-destructive/5 border-destructive/40"
                : triage?.level === "medium"
                ? "bg-accent/5 border-accent/30"
                : "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🤝</span>
              <span className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
                Sakhi Salah
              </span>
            </div>
            <p className={`font-bold text-base leading-snug ${
              triage?.level === "high"
                ? "text-destructive"
                : triage?.level === "medium"
                ? "text-accent"
                : "text-emerald-700 dark:text-emerald-400"
            }`}>
              {salah}
            </p>
          </motion.div>
        )}

        {/* BP row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.bpSystolic}</label>
            <div className={`flex items-center gap-2 bg-card/60 rounded-2xl px-4 py-3.5 border border-border transition-all ${gc("bp")}`}>
              <Heart className="w-4 h-4 text-destructive shrink-0" />
              {/* data-field required for QA */}
              <input
                data-field="bpSys"
                type="number"
                inputMode="numeric"
                value={bpSys}
                onChange={(e) => setBpSys(e.target.value)}
                placeholder="120"
                className="flex-1 bg-transparent outline-none text-lg font-bold text-foreground"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.bpDiastolic}</label>
            <div className={`flex items-center gap-2 bg-card/60 rounded-2xl px-4 py-3.5 border border-border transition-all ${gc("bp")}`}>
              <Heart className="w-4 h-4 text-accent shrink-0" />
              {/* data-field required for QA */}
              <input
                data-field="bpDia"
                type="number"
                inputMode="numeric"
                value={bpDia}
                onChange={(e) => setBpDia(e.target.value)}
                placeholder="80"
                className="flex-1 bg-transparent outline-none text-lg font-bold text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.weight}</label>
          <div className={`flex items-center gap-2 bg-card/60 rounded-2xl px-4 py-3.5 border border-border transition-all ${gc("weight")}`}>
            <Activity className="w-4 h-4 text-primary shrink-0" />
            <input
              data-field="weight"
              type="number"
              inputMode="numeric"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="55"
              className="flex-1 bg-transparent outline-none text-lg font-bold text-foreground"
            />
            <span className="text-muted-foreground text-sm">kg</span>
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t.symptoms}</label>
          <div className={`bg-card/60 rounded-2xl px-4 py-3.5 border border-border transition-all ${gc("symptoms")}`}>
            <textarea
              data-field="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={t.enterSymptoms}
              rows={3}
              className="w-full bg-transparent outline-none text-foreground resize-none"
            />
          </div>
        </div>

        {/* AI Visit Summary Note */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-muted-foreground block">AI Visit Summary Note</label>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Generated</span>
          </div>
          <div className="bg-emerald-50/40 dark:bg-emerald-900/10 rounded-2xl px-4 py-4 border border-emerald-500/20 shadow-sm">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <span className="text-sm">🤖</span>
              </div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="AI will generate a summary..."
                rows={5}
                className="w-full bg-transparent outline-none text-sm font-medium text-foreground resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Translation: ASHA writes Kannada, ANM sees Hindi ─────────────── */}
      <div className="mt-4">
        <TranslatePanel
          initialText={transcript || symptoms}
          defaultSrc="kan"
          defaultTgt="hin"
        />
      </div>

      {/* ── Save button ─────────────────────────────────────────────────── */}
      {/* data-action required for QA */}
      <motion.button
        data-action="save-visit"
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={!bpSys && !symptoms}
        className="mt-6 w-full bg-gradient-primary text-primary-foreground py-5 rounded-3xl font-bold text-lg shadow-mic flex items-center justify-center gap-2 min-tap disabled:opacity-50"
      >
        <Save className="w-5 h-5" /> {t.saveVisit}
      </motion.button>
    </div>
  );
}
