import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * RiskAlert — full-screen red emergency screen for high-risk patients.
 * No navbar. One huge action button. Designed for ASHA workers in the field.
 */
export default function RiskAlert() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-600 px-6 text-center text-white"
    >
      {/* Pulsing alert icon */}
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center mb-8"
      >
        <AlertTriangle className="w-16 h-16 text-white" strokeWidth={2.5} />
      </motion.div>

      {/* Headline */}
      <h1 className="text-4xl font-black uppercase tracking-wide leading-tight mb-3">
        HIGH RISK DETECTED
      </h1>
      <p className="text-xl font-semibold opacity-90 mb-2">
        Refer to PHC Immediately
      </p>
      <p className="text-base opacity-75 max-w-xs mb-12">
        This patient needs urgent medical attention today. Do not delay.
      </p>

      {/* Primary CTA */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate("/patients")}
        className="w-full max-w-xs h-14 bg-white text-red-600 text-lg font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 mb-4"
      >
        <Navigation className="w-5 h-5" />
        Mark as Referred
      </motion.button>

      {/* Secondary — call PHC */}
      <motion.a
        whileTap={{ scale: 0.96 }}
        href="tel:108"
        className="w-full max-w-xs h-14 border-2 border-white/60 text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-3"
      >
        <Phone className="w-5 h-5" />
        Call 108 (Emergency)
      </motion.a>
    </motion.div>
  );
}
