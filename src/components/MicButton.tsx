import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { useT } from "@/hooks/useT";

type Props = {
  recording: boolean;
  onStart: () => void;
  onStop: () => void;
  size?: number;
};

export default function MicButton({ recording, onStart, onStop, size = 80 }: Props) {
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
          whileTap={{ scale: 0.93 }}
          onPointerDown={onStart}
          onPointerUp={onStop}
          onPointerLeave={recording ? onStop : undefined}
          className={`relative rounded-full bg-gradient-mic flex items-center justify-center min-tap ${
            recording ? "animate-mic-pulse" : ""
          }`}
          style={{ width: size, height: size, boxShadow: "var(--shadow-mic)" }}
          aria-label="Microphone"
        >
          <Mic
            className="text-primary-foreground"
            style={{ width: size * 0.4, height: size * 0.4 }}
            strokeWidth={2.2}
          />
        </motion.button>
      </div>

      <span className="text-primary font-bold text-base tracking-wide">
        {recording ? t.listening : t.bolo}
      </span>
    </div>
  );
}
