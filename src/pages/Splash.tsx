import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Mic, ShieldCheck, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { initSTT, setSTTProgressCallback } from "@/agents/sttAgent";
import { toast } from "sonner";

export default function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    // Start initializing the model in the background immediately
    initSTT();

    // Just show the splash for 2 seconds then move on
    const t = setTimeout(() => {
      nav("/language");
    }, 2500);

    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pattern-organic relative overflow-hidden bg-white">
      <div className="absolute inset-0 pattern-dots opacity-40" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-28 h-28 rounded-3xl bg-gradient-primary shadow-mic flex items-center justify-center">
          <Heart className="w-14 h-14 text-primary-foreground" fill="currentColor" />
        </div>
        <h1 className="mt-8 text-5xl font-display text-primary">SevaSaathi</h1>
        <p className="text-accent font-semibold tracking-widest text-sm mt-1 uppercase">AI Healthcare</p>
      </motion.div>

      <div className="absolute bottom-10 text-xs text-muted-foreground">
        For ASHA Workers • Made in India
      </div>
    </div>
  );
}
