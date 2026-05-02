import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Check, Clock, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useT } from "@/hooks/useT";
import WhyModal from "./WhyModal";

type Props = {
  patientContext: string;
  action: string;
  explanation: string;
  onDone: () => void;
  onSnooze: () => void;
};

export default function ActionCard({ patientContext, action, explanation, onDone, onSnooze }: Props) {
  const t = useT();
  const [showWhy, setShowWhy] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 space-y-4"
      >
        {/* Patient context */}
        <p className="text-xs text-muted-foreground font-semibold">{patientContext}</p>

        {/* Single action */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-wider font-bold text-accent">
              {t.actionRequired}
            </div>
            <p className="text-foreground font-bold mt-1 leading-snug">{action}</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onDone}
            className="flex-1 bg-gradient-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 min-tap"
          >
            <Check className="w-4 h-4" /> {t.done}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onSnooze}
            className="flex-1 bg-card border border-border py-3.5 rounded-2xl font-bold text-sm text-foreground flex items-center justify-center gap-2 min-tap"
          >
            <Clock className="w-4 h-4" /> {t.snooze}
          </motion.button>
        </div>

        {/* Why */}
        <button
          onClick={() => setShowWhy(true)}
          className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mx-auto min-tap"
        >
          <HelpCircle className="w-3.5 h-3.5" /> {t.why}
        </button>
      </motion.div>

      <AnimatePresence>
        {showWhy && (
          <WhyModal explanation={explanation} onClose={() => setShowWhy(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
