import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import type { Lang } from "@/lib/i18n";
import { Check } from "lucide-react";
import { useState } from "react";

const langs: { code: Lang; name: string; native: string; greet: string }[] = [
  { code: "en", name: "English", native: "English", greet: "Hello" },
  { code: "hi", name: "Hindi", native: "हिन्दी", greet: "नमस्ते" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", greet: "ನಮಸ್ಕಾರ" },
];

export default function LanguageSelect() {
  const nav = useNavigate();
  const setLang = useStore((s) => s.setLang);
  const current = useStore((s) => s.lang);
  const [picked, setPicked] = useState<Lang>(current);

  const proceed = () => {
    setLang(picked);
    nav("/login");
  };

  return (
    <div className="min-h-screen px-6 py-10 pattern-organic">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-display text-primary leading-tight">
          Choose your<br />language
        </h2>
        <p className="text-muted-foreground mt-2">अपनी भाषा चुनें • ನಿಮ್ಮ ಭಾಷೆ ಆರಿಸಿ</p>
      </motion.div>

      <div className="mt-10 space-y-4">
        {langs.map((l, i) => {
          const active = picked === l.code;
          return (
            <motion.button
              key={l.code}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPicked(l.code)}
              className={`w-full glass-card p-5 flex items-center justify-between transition-all ${
                active ? "ring-2 ring-primary shadow-glow" : ""
              }`}
            >
              <div className="text-left">
                <div className="text-2xl font-display text-foreground">{l.native}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{l.greet} • {l.name}</div>
              </div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-transparent"
                }`}
              >
                <Check className="w-5 h-5" />
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.97 }}
        onClick={proceed}
        className="mt-10 w-full bg-gradient-primary text-primary-foreground py-5 rounded-3xl font-bold text-lg shadow-mic"
      >
        Continue →
      </motion.button>
    </div>
  );
}
