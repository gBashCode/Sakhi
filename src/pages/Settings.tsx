import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Mic, Wifi, Download, LogOut, Info, ChevronRight } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";

export default function Settings() {
  const t = useT();
  const nav = useNavigate();
  const { settings, updateSettings, setLoggedIn } = useStore();

  const items = [
    {
      icon: Globe, label: t.language, value: t.change,
      onClick: () => nav("/language"), toggle: false,
    },
    {
      icon: Mic, label: t.voiceOnOff, toggle: true,
      checked: settings.voiceEnabled,
      onToggle: () => updateSettings({ voiceEnabled: !settings.voiceEnabled }),
    },
    {
      icon: Wifi, label: t.syncWifi, toggle: true,
      checked: settings.syncOnWifiOnly,
      onToggle: () => updateSettings({ syncOnWifiOnly: !settings.syncOnWifiOnly }),
    },
    {
      icon: Download, label: t.downloadData, toggle: false,
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen pb-32 px-5 pt-6">
      <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap mb-4">
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>

      <h1 className="text-3xl font-display text-primary mb-6">{t.settings}</h1>

      <div className="space-y-3">
        {items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <it.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-foreground">{it.label}</div>
              {it.value && <div className="text-xs text-muted-foreground">{it.value}</div>}
            </div>
            {it.toggle ? (
              <button
                onClick={it.onToggle}
                className={`w-14 h-8 rounded-full transition-colors relative min-tap ${
                  it.checked ? "bg-primary" : "bg-muted"
                }`}
              >
                <motion.div
                  className="absolute top-1 w-6 h-6 rounded-full bg-white shadow"
                  animate={{ left: it.checked ? 28 : 4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </button>
            ) : (
              <button onClick={it.onClick} className="min-tap">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </motion.div>
        ))}

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setLoggedIn(false); nav("/"); }}
          className="w-full glass-card p-4 flex items-center gap-3 border-destructive/30"
        >
          <div className="w-11 h-11 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="font-bold text-destructive">{t.logout}</div>
        </motion.button>

        {/* Version */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" /> {t.appVersion}: {t.version}
          </div>
        </div>
      </div>
    </div>
  );
}
