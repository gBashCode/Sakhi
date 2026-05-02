/**
 * VisitForm.tsx
 * Saves visits to Dexie (offline-first), uses useVoice for mic transcription,
 * calculates risk, routes to HIGH-RISK alert when needed.
 *
 * CRITICAL: Never delete onClick, onChange, data-field, data-action, or db.visits.add()
 */
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Activity, Heart } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore, type Risk } from "@/lib/store";
import { useVoice } from "@/hooks/useVoice";
import { db } from "@/lib/db";
import MicButton from "@/components/MicButton";
import VoiceTranscript from "@/components/VoiceTranscript";
import RiskBadge from "@/components/RiskBadge";
import { toast } from "sonner";

// ── Risk engine (inline, mirrors getRisk from utils) ──────────────────────────
function calcRisk(sys: number | null, dia: number | null, symp: string): Risk {
  if ((sys && sys >= 140) || (dia && dia >= 90)) return "high";
  const s = symp.toLowerCase();
  if (s.includes("swelling") || s.includes("bleeding")) return "high";
  if ((sys && sys >= 130) || (dia && dia >= 85)) return "medium";
  if (s.includes("headache") || s.includes("fever")) return "medium";
  return "low";
}

// ── Vitals parser (mirrors parseVitals from utils) ────────────────────────────
function parseVitals(text: string): { bpSys?: string; bpDia?: string; weight?: string; symptoms?: string } {
  const result: { bpSys?: string; bpDia?: string; weight?: string; symptoms?: string } = {};
  // BP: "BP 150 by 90" | "BP 150/90" | "150 over 90"
  const bp = text.match(/(?:bp\s*)?(\d{2,3})\s*(?:by|\/|over)\s*(\d{2,3})/i);
  if (bp) { result.bpSys = bp[1]; result.bpDia = bp[2]; }
  else { const s = text.match(/(?:bp)\s*(\d{2,3})/i); if (s) result.bpSys = s[1]; }
  // Weight: "58 kg"
  const wt = text.match(/(\d{2,3})\s*(?:kg|kilo)/i);
  if (wt) result.weight = wt[1];
  // Symptoms
  const kw = ["headache","fever","swelling","nausea","bleeding","pain","fatigue","vomiting","dizziness"];
  const found = kw.filter((k) => text.toLowerCase().includes(k));
  if (found.length) result.symptoms = found.join(", ");
  return result;
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
  const [risk, setRisk] = useState<Risk>("low");
  const [glowField, setGlowField] = useState<string | null>(null);

  // ── useVoice hook (real Whisper transcription) ────────────────────────────
  const { recording, transcribing, transcript, start, stop } = useVoice();

  // ── Risk: recalculate on BP / symptom change ──────────────────────────────
  useEffect(() => {
    setRisk(calcRisk(parseInt(bpSys) || null, parseInt(bpDia) || null, symptoms));
  }, [bpSys, bpDia, symptoms]);

  // ── Glow clear ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (glowField) {
      const t2 = setTimeout(() => setGlowField(null), 1500);
      return () => clearTimeout(t2);
    }
  }, [glowField]);

  // ── Parse transcript into form fields ─────────────────────────────────────
  useEffect(() => {
    if (!transcript) return;
    const parsed = parseVitals(transcript);
    if (parsed.bpSys) { setBpSys(parsed.bpSys); setGlowField("bp"); }
    if (parsed.bpDia) setBpDia(parsed.bpDia);
    if (parsed.weight) { setWeight(parsed.weight); setGlowField("weight"); }
    if (parsed.symptoms) {
      setSymptoms((prev) => {
        const existing = prev ? prev.split(", ") : [];
        const merged = [...new Set([...existing, ...parsed.symptoms!.split(", ")])];
        return merged.join(", ");
      });
      setGlowField("symptoms");
    }
  }, [transcript]);

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

  const gc = (f: string) => (glowField === f ? "animate-glow-field field-glow" : "");

  return (
    <div className="min-h-screen pb-32 px-5 pt-6 pattern-organic">
      {/* Back button */}
      <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap mb-4">
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>

      <h1 className="text-3xl font-display text-primary">{t.visitForm}</h1>
      {patient && <p className="text-muted-foreground text-sm mt-1">{patient.name} • {patient.age} yrs</p>}

      {/* ── Mic Button ─────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col items-center gap-2">
        {/* data-action required for QA regression tests */}
        <div data-action="mic-record">
          <MicButton
            recording={recording}
            onStart={start}
            onStop={stop}
          />
        </div>
        {transcribing && (
          <p className="text-xs text-accent font-semibold animate-pulse">Transcribing…</p>
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

      {/* ── Form fields ────────────────────────────────────────────────── */}
      <div className="mt-6 space-y-4">
        {/* Risk badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground">{t.riskLevel}</span>
          <RiskBadge risk={risk} size="md" />
        </div>

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
