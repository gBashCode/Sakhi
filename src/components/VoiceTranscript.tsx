import { motion, AnimatePresence } from "framer-motion";
import { Pencil, AlertCircle } from "lucide-react";
import { useT } from "@/hooks/useT";

type Props = {
  text: string;
  confidence?: number; // 0-100
  error?: boolean;
  onEdit?: () => void;
};

export default function VoiceTranscript({ text, confidence = 92, error, onEdit }: Props) {
  const t = useT();

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 flex items-center gap-3"
      >
        <AlertCircle className="w-6 h-6 text-accent shrink-0" />
        <p className="text-sm text-muted-foreground flex-1">{t.couldntHear}</p>
        <button onClick={onEdit} className="text-primary text-sm font-bold min-tap flex items-center">
          {t.typeManually}
        </button>
      </motion.div>
    );
  }

  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 space-y-3"
    >
      {/* Transcript text */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
            {t.transcript}
          </div>
          <p className="text-foreground font-semibold leading-relaxed">
            "{text}"
          </p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-primary text-xs font-semibold flex items-center gap-1 min-tap shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" /> {t.edit}
          </button>
        )}
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-muted-foreground font-semibold">{t.confidence}</span>
          <span className="text-primary font-bold">{confidence}%</span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
