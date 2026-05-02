/**
 * TranslatePanel.tsx
 * Inline translation widget for ASHA→ANM handoff.
 * ASHA enters text in Kannada/Tamil/Telugu/Bengali.
 * ANM sees the same text in Hindi (or vice versa).
 *
 * Uses translateAgent.js (NLLB-200 via @xenova/transformers).
 * Model loads from browser cache on first use.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Languages, Loader2, ChevronDown } from "lucide-react";
// @ts-ignore
import { translate, getSupportedLanguages } from "@/agents/translateAgent";

interface Props {
  /** Pre-fill the source text (e.g. from STT transcript) */
  initialText?: string;
  /** Default source language */
  defaultSrc?: string;
  /** Default target language */
  defaultTgt?: string;
}

export default function TranslatePanel({
  initialText = "",
  defaultSrc = "kan",
  defaultTgt = "hin",
}: Props) {
  const langs = getSupportedLanguages() as Record<string, string>;

  const [srcLang, setSrcLang] = useState(defaultSrc);
  const [tgtLang, setTgtLang] = useState(defaultTgt);
  const [input, setInput]     = useState(initialText);
  const [output, setOutput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [modelMsg, setModelMsg] = useState<string | null>(null);

  const handleTranslate = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setOutput("");
    // Warn about model size on very first call
    if (!modelMsg) {
      setModelMsg("Loading NLLB-200 model (1.2 GB on first use — cached after that)…");
    }
    try {
      const result = await translate(input, srcLang, tgtLang);
      setOutput(result);
      setModelMsg(null);
    } catch (err: any) {
      setError(
        err?.message?.includes("fetch")
          ? "Network needed for first model load. Connect once then works offline."
          : `Translation failed: ${err?.message ?? "unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  }, [input, srcLang, tgtLang, modelMsg]);

  const swap = () => {
    setSrcLang(tgtLang);
    setTgtLang(srcLang);
    setInput(output);
    setOutput(input);
  };

  return (
    <div
      className="rounded-3xl border border-border bg-card/60 p-4 space-y-3"
      data-testid="translate-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Languages className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Anuvad (Translation)</span>
        <span className="text-[10px] text-muted-foreground ml-auto">ASHA → ANM</span>
      </div>

      {/* Language selectors */}
      <div className="flex items-center gap-2">
        <LangSelect value={srcLang} onChange={setSrcLang} langs={langs} />
        <button
          onClick={swap}
          className="text-xs text-primary font-bold px-2 py-1 rounded-xl hover:bg-primary/10 transition-colors"
          title="Swap languages"
        >
          ⇄
        </button>
        <LangSelect value={tgtLang} onChange={setTgtLang} langs={langs} />
      </div>

      {/* Source textarea */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`Type in ${langs[srcLang] ?? srcLang}…`}
        rows={3}
        className="w-full bg-background/60 border border-border rounded-2xl px-3 py-2.5 text-sm text-foreground outline-none resize-none placeholder:text-muted-foreground"
      />

      {/* Translate button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleTranslate}
        disabled={loading || !input.trim()}
        className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Translating…</>
        ) : (
          <><Languages className="w-4 h-4" /> Translate</>
        )}
      </motion.button>

      {/* Model loading message */}
      <AnimatePresence>
        {modelMsg && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-accent text-center leading-relaxed"
          >
            ⏳ {modelMsg}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2 leading-relaxed">
          {error}
        </p>
      )}

      {/* Output */}
      <AnimatePresence>
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="translation-output"
            className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3"
          >
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
              {langs[tgtLang] ?? tgtLang}
            </p>
            <p className="text-sm font-medium text-foreground leading-relaxed">{output}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function LangSelect({
  value, onChange, langs,
}: {
  value: string;
  onChange: (v: string) => void;
  langs: Record<string, string>;
}) {
  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-background/60 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none cursor-pointer pr-7"
      >
        {Object.entries(langs).map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}
