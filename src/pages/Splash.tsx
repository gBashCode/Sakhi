import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { initSTT } from "@/agents/sttAgent";

export default function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    // Initialize native speech permissions
    initSTT();
    
    // Quick transition to language selection
    const t = setTimeout(() => {
      nav("/language");
    }, 2000);
    
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pattern-organic relative overflow-hidden bg-white">
      <div className="absolute inset-0 pattern-dots opacity-40" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center w-full px-8"
      >
        <div className="w-28 h-28 flex items-center justify-center bg-white rounded-full shadow-xl border border-slate-100 p-2">
          <img src="/logo.png" alt="Sakhi Logo" className="w-full h-full object-contain drop-shadow-md" />
        </div>
        <h1 className="mt-6 text-5xl font-display text-primary">Sakhi</h1>
        <p className="text-accent font-semibold tracking-widest text-sm mt-1 uppercase">AI Healthcare</p>
        
        <div className="mt-12 flex flex-col items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Offline AI Ready
          </p>
        </div>
      </motion.div>

      <div className="absolute bottom-10 text-xs text-muted-foreground">
        For ASHA Workers • Made in India
      </div>
    </div>
  );
}
