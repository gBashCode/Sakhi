import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { initSTT, getModelStatus } from "@/agents/sttAgent";

const FIRST_INSTALL_KEY = "sakhi_model_installed";

export default function Splash() {
  const nav = useNavigate();
  const [stage, setStage] = useState<"logo" | "downloading" | "done">("logo");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("AI initialize ho rahi hai...");
  const isFirstInstall = !localStorage.getItem(FIRST_INSTALL_KEY);

  useEffect(() => {
    if (isFirstInstall) {
      // Show logo briefly then start download
      const t = setTimeout(() => startDownload(), 1200);
      return () => clearTimeout(t);
    } else {
      // Returning user — just init in background and go
      initSTT();
      const t = setTimeout(() => nav("/language"), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  const startDownload = async () => {
    setStage("downloading");
    setStatusText("Whisper AI model download ho raha hai...");

    try {
      // Pass progress handler to initSTT
      await initSTT((p) => {
        setProgress(p);
        if (p > 99) setStatusText("AI ready hai! ✅");
        else setStatusText(`Downloading: ${p}%`);
      });
      
      setProgress(100);
      setStage("done");
      localStorage.setItem(FIRST_INSTALL_KEY, "1");
      setTimeout(() => nav("/language"), 1500);
    } catch (e) {
      // Even if model fails, allow app to continue
      setProgress(100);
      setStatusText("AI baad mein load hogi. Continue karo.");
      setStage("done");
      localStorage.setItem(FIRST_INSTALL_KEY, "1");
      setTimeout(() => nav("/language"), 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pattern-organic relative overflow-hidden bg-white">
      <div className="absolute inset-0 pattern-dots opacity-40" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center w-full px-8"
      >
        {/* Logo */}
        <div className="w-28 h-28 flex items-center justify-center bg-white rounded-full shadow-xl border border-slate-100 p-2">
          <img src="/logo.png" alt="Sakhi Logo" className="w-full h-full object-contain drop-shadow-md" />
        </div>
        <h1 className="mt-6 text-5xl font-display text-primary">Sakhi</h1>
        <p className="text-accent font-semibold tracking-widest text-sm mt-1 uppercase">AI Healthcare</p>

        {/* Download stage */}
        <AnimatePresence>
          {stage === "downloading" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 w-full"
            >
              {/* First-time badge */}
              <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 mb-6 text-center">
                <p className="text-primary font-bold text-sm">🎉 Pehli baar setup ho rahi hai</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Offline AI model ek baar download hoga (~140MB). Baad mein koi internet nahi chahiye.
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-secondary rounded-full h-4 overflow-hidden shadow-inner">
                <motion.div
                  className="h-4 bg-gradient-to-r from-primary to-accent rounded-full"
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <p className="text-center text-sm font-bold text-primary mt-2">
                {Math.round(progress)}%
              </p>
              <p className="text-center text-xs text-muted-foreground mt-1">{statusText}</p>

              {/* What's downloading */}
              <div className="mt-6 space-y-2">
                {[
                  { label: "Whisper Hindi AI", size: "~140MB", done: progress > 30 },
                  { label: "Medical NER Engine", size: "Regex — 0MB", done: progress > 10 },
                  { label: "MoHFW Risk Rules", size: "Built-in", done: progress > 10 },
                  { label: "Offline TTS Voice", size: "Android built-in", done: progress > 5 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-2">
                    <span className="text-lg">{item.done ? "✅" : "⏳"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.size}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-muted-foreground mt-6">
                📶 WiFi pe download karo. Baad mein 100% offline kaam karega.
              </p>
            </motion.div>
          )}

          {stage === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 text-center"
            >
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-primary font-bold text-xl">Sakhi ready hai!</p>
              <p className="text-muted-foreground text-sm mt-1">Ab bina internet ke bhi kaam karegi</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {stage === "logo" && (
        <div className="absolute bottom-10 text-xs text-muted-foreground">
          For ASHA Workers • Made in India
        </div>
      )}
    </div>
  );
}
