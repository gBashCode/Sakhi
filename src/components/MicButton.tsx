import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { useT } from "@/hooks/useT";

type Props = {
  recording: boolean;
  onStart: () => void;
  onStop: () => void;
  size?: number;
  disabled?: boolean;
};

export default function MicButton({ recording, onStart, onStop, size = 80, disabled }: Props) {
  const t = useT();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Pulse rings */}
        {recording && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-primary-glow/40 blur-2xl"
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.15, 0.6] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -inset-4 rounded-full border-2 border-primary/40"
              animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -inset-8 rounded-full border-2 border-primary/25"
              animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.35 }}
            />
          </>
        )}

        <motion.button
          whileTap={disabled ? {} : { scale: 0.93 }}
          onPointerDown={disabled ? undefined : onStart}
          onPointerUp={disabled ? undefined : onStop}
          onClick={disabled ? undefined : (recording ? onStop : onStart)}
          disabled={disabled}
          className={`relative rounded-full bg-gradient-mic flex flex-col items-center justify-center min-tap ${
            recording ? "animate-mic-pulse" : ""
          } ${disabled ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
          style={{ width: size, height: size, boxShadow: disabled ? "none" : "var(--shadow-mic)" }}
          aria-label="Microphone"
        >
          <Mic
            className="text-primary-foreground"
            style={{ width: size * 0.4, height: size * 0.4 }}
            strokeWidth={2.2}
          />
          {recording && !disabled && (
            <span className="text-[10px] text-primary-foreground font-bold mt-1 uppercase tracking-tighter">
              Tap to End
            </span>
          )}
          {disabled && (
            <span className="text-[10px] text-primary-foreground font-bold mt-1 uppercase tracking-tighter">
              Wait...
            </span>
          )}
        </motion.button>
      </div>

      <span className="text-primary font-bold text-base tracking-wide">
        {disabled ? 'AI Loading...' : recording ? 'Stop' : 'Speak'}
      </span>
    </div>
  );
}
