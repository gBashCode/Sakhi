import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export default function HighRiskAlert() {
  const t = useT();
  const nav = useNavigate();
  const location = useLocation();
  const markReferred = useStore((s) => s.markReferred);
  const patientId = (location.state as any)?.patientId;

  const handleRefer = () => {
    if (patientId) markReferred(patientId);
    toast.success(t.referred);
    nav("/home");
  };

  return (
    <div className="min-h-screen urgent-bg flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
      {/* Animated danger rings */}
      <motion.div
        className="absolute w-80 h-80 rounded-full border-2 border-red-500/20"
        animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-60 h-60 rounded-full border-2 border-red-500/30"
        animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />

      {/* Warning icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative z-10"
      >
        <div className="w-28 h-28 rounded-full bg-red-600 flex items-center justify-center animate-urgent-pulse shadow-danger">
          <AlertTriangle className="w-14 h-14 text-white" />
        </div>
      </motion.div>

      {/* Text */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-4xl font-display text-white leading-tight relative z-10"
      >
        {t.highRiskAlert}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 text-red-200 text-lg font-semibold relative z-10"
      >
        {t.referPHC}
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleRefer}
        className="mt-10 w-full max-w-xs bg-white text-red-700 py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-2 min-tap relative z-10"
        style={{ boxShadow: "0 20px 60px -12px rgba(255,255,255,0.3)" }}
      >
        {t.markReferred} <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
