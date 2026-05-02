import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Mic, ShieldCheck, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { initSTT, setSTTProgressCallback } from "@/agents/sttAgent";
import { toast } from "sonner";

export default function Splash() {
  const nav = useNavigate();
  const [step, setStep] = useState<"splash" | "permissions" | "downloading">("splash");
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");

  useEffect(() => {
    if (step === "splash") {
      const t = setTimeout(() => setStep("permissions"), 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const requestPermissions = async () => {
    try {
      // Standard web request triggers the OS permission dialog
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());

      setStep("downloading");
      startAIInstallation();
    } catch (err) {
      toast.error("Microphone permission is required for AI features");
    }
  };

  const startAIInstallation = async () => {
    // 1. Define the callback
    const callback = (p: any) => {
      if (p.status === 'progress') {
        setProgress(Math.round(p.progress));
        setCurrentFile(p.file.split('/').pop() || "");
      }
      if (p.status === 'ready') {
        setProgress(100);
        setTimeout(() => nav("/language"), 800);
      }
    };

    // 2. Set it in the agent
    setSTTProgressCallback(callback);

    // 3. Start/Join initialization
    try {
      await initSTT();
      // If it finished instantly (already ready), initSTT in agent now triggers 'ready' status
    } catch (err) {
      console.error("AI Install failed", err);
      toast.error("Offline AI failed to load. Using basic mode.");
      setTimeout(() => nav("/language"), 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pattern-organic relative overflow-hidden bg-white">
      <div className="absolute inset-0 pattern-dots opacity-40" />

      <AnimatePresence mode="wait">
        {step === "splash" && (
          <motion.div
            key="logo"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="w-28 h-28 rounded-3xl bg-gradient-primary shadow-mic flex items-center justify-center">
              <Heart className="w-14 h-14 text-primary-foreground" fill="currentColor" />
            </div>
            <h1 className="mt-8 text-5xl font-display text-primary">SevaSaathi</h1>
            <p className="text-accent font-semibold tracking-widest text-sm mt-1 uppercase">AI Healthcare</p>
          </motion.div>
        )}

        {step === "permissions" && (
          <motion.div
            key="perms"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative z-10 flex flex-col items-center px-8 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Setup AI Assistant</h2>
            <p className="text-muted-foreground mt-2 mb-8">
              To help you with voice entry, SevaSaathi needs permission to use the microphone.
            </p>
            <button
              onClick={requestPermissions}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <Mic className="w-5 h-5" /> Grant Permission
            </button>
          </motion.div>
        )}

        {step === "downloading" && (
          <motion.div
            key="download"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-col items-center w-full px-10"
          >
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6 animate-bounce">
              <Download className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Installing AI Intelligence</h2>
            <p className="text-sm text-muted-foreground mb-8">Setting up offline medical brain...</p>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between w-full text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              <span>{currentFile || "Initializing"}</span>
              <span>{progress}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 text-xs text-muted-foreground">
        For ASHA Workers • Made in India
      </div>
    </div>
  );
}
