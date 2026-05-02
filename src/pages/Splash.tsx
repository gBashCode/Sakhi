import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useEffect } from "react";

export default function Splash() {
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => nav("/language"), 2200);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pattern-organic relative overflow-hidden">
      <div className="absolute inset-0 pattern-dots opacity-40" />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-primary-glow blur-2xl"
          />
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-primary shadow-mic flex items-center justify-center">
            <Heart className="w-14 h-14 text-primary-foreground" fill="currentColor" />
          </div>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-5xl font-display text-primary"
        >
          SevaSaathi
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-accent font-semibold tracking-widest text-sm mt-1"
        >
          AI HEALTHCARE COMPANION
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 text-xs text-muted-foreground"
      >
        For ASHA Workers • Made in India
      </motion.div>
    </div>
  );
}
