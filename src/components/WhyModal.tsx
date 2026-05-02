import { motion } from "framer-motion";
import { Info, X } from "lucide-react";

type Props = {
  explanation: string;
  onClose: () => void;
};

export default function WhyModal({ explanation, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 space-y-4"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg text-foreground">Why this recommendation?</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center min-tap">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-foreground/80 leading-relaxed">{explanation}</p>
      </motion.div>
    </motion.div>
  );
}
