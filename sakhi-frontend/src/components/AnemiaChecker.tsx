/**
 * AnemiaChecker.tsx
 * Camera capture component for conjunctival/palmar pallor screening.
 * Shows live viewfinder → capture button → instant pallor analysis.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, RefreshCw, Eye } from "lucide-react";
// @ts-ignore
import { analyzeImage, captureFromVideo } from "@/agents/visionAgent";

type AnemiaResult = {
  risk: "anemia_risk" | "borderline" | "normal";
  score: number;
  confidence: "high" | "medium" | "low";
  detail: string;
};

interface Props {
  onResult?: (result: AnemiaResult) => void;
}

export default function AnemiaChecker({ onResult }: Props) {
  const [open, setOpen]         = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured]  = useState<string | null>(null);
  const [result, setResult]      = useState<AnemiaResult | null>(null);
  const [checking, setChecking]  = useState(false);
  const [error, setError]        = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      setError("Camera access denied. Please allow camera in browser settings.");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  useEffect(() => {
    if (open) startCamera();
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // Capture + analyse
  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;
    const dataUrl = captureFromVideo(videoRef.current);
    setCaptured(dataUrl);
    stopCamera();
    setChecking(true);
    try {
      const r = await analyzeImage(dataUrl);
      setResult(r);
      onResult?.(r);
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setChecking(false);
    }
  }, [stopCamera, onResult]);

  const handleReset = () => {
    setCaptured(null);
    setResult(null);
    setError(null);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setOpen(false);
    setCaptured(null);
    setResult(null);
    setError(null);
  };

  // Risk colour config
  const riskConfig = {
    anemia_risk: { bg: "bg-destructive/10 border-destructive/40", text: "text-destructive", label: "Anemia Risk", emoji: "🔴" },
    borderline:  { bg: "bg-accent/10 border-accent/30",           text: "text-accent",      label: "Borderline",   emoji: "🟡" },
    normal:      { bg: "bg-emerald-50 border-emerald-200",         text: "text-emerald-700", label: "Normal",       emoji: "🟢" },
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2.5 rounded-2xl text-sm font-bold min-tap hover:bg-primary/20 transition-colors"
        title="Check for anemia (conjunctival pallor)"
      >
        <Eye className="w-4 h-4" />
        Anemia Check
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <div>
                <h2 className="text-xl font-display text-primary">Anemia Screen</h2>
                <p className="text-xs text-muted-foreground">
                  {captured ? "Analysis result" : "Aim camera at inner lower eyelid (conjunctiva) or palm"}
                </p>
              </div>
              <button onClick={handleClose} className="w-10 h-10 glass-card rounded-full flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera / preview area */}
            <div className="flex-1 relative overflow-hidden mx-4 rounded-3xl bg-black">
              {!captured ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {/* ROI guide overlay */}
                  {streaming && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-24 border-2 border-white/70 rounded-2xl relative">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Eyelid / Palm area
                        </div>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white text-center px-6 text-sm">{error}</p>
                    </div>
                  )}
                </>
              ) : (
                <img src={captured} alt="Captured" className="w-full h-full object-cover" />
              )}

              {/* Checking overlay */}
              {checking && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  <p className="text-white font-bold text-sm">Analysing pallor…</p>
                </div>
              )}
            </div>

            {/* Result card */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                data-testid="anemia-result"
                className={`mx-4 mt-3 rounded-2xl px-4 py-3 border ${riskConfig[result.risk].bg}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-base ${riskConfig[result.risk].text}`}>
                    {riskConfig[result.risk].emoji} {riskConfig[result.risk].label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Score: {(result.score * 100).toFixed(0)}% · {result.confidence} confidence
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{result.detail}</p>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 px-4 py-5 shrink-0">
              {!captured ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCapture}
                  disabled={!streaming}
                  className="flex-1 bg-gradient-primary text-primary-foreground py-4 rounded-3xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Camera className="w-5 h-5" /> Capture
                </motion.button>
              ) : (
                <>
                  <button onClick={handleReset} className="flex-1 glass-card py-4 rounded-3xl font-bold text-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Retake
                  </button>
                  <button onClick={handleClose} className="flex-1 bg-primary text-primary-foreground py-4 rounded-3xl font-bold text-sm">
                    Done
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
