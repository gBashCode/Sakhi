import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Globe, LogOut, MapPin, Award, ChevronRight, Settings, BarChart3 } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";

export default function Profile() {
  const t = useT();
  const nav = useNavigate();
  const { setLoggedIn, patients, userName } = useStore();

  const items = [
    { icon: Globe, label: t.language, value: t.change, onClick: () => nav("/language") },
    { icon: MapPin, label: t.village, value: "Tumkur, KA" },
    { icon: Award, label: t.records, value: `${patients.length} ${t.patients}` },
    { icon: Settings, label: t.settings, value: "", onClick: () => nav("/settings") },
    { icon: BarChart3, label: t.metrics, value: "Admin", onClick: () => nav("/metrics") },
  ];

  return (
    <div className="min-h-screen pb-32 px-5 pt-6">
      <h1 className="text-3xl font-display text-primary">{t.profile}</h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 glass-card p-6 text-center relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
        <div className="w-20 h-20 rounded-3xl bg-gradient-primary mx-auto flex items-center justify-center shadow-mic">
          <User className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="mt-3 text-2xl font-display text-foreground">{userName} Didi</div>
        <div className="text-sm text-muted-foreground">{t.asha}</div>
      </motion.div>

      <div className="mt-5 space-y-3">
        {items.map((it, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.98 }}
            onClick={it.onClick}
            className="w-full glass-card p-4 flex items-center gap-3 min-tap"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <it.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-foreground">{it.label}</div>
              {it.value && <div className="text-xs text-muted-foreground">{it.value}</div>}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        ))}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => { setLoggedIn(false); nav("/"); }}
          className="w-full glass-card p-4 flex items-center gap-3 border-destructive/30 min-tap"
        >
          <div className="w-11 h-11 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="font-bold text-destructive">{t.logout}</div>
        </motion.button>
      </div>
    </div>
  );
}
