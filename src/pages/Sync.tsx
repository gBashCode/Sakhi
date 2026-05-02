import { motion } from "framer-motion";
import { useState } from "react";
import { CloudUpload, CheckCircle2, Clock } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export default function Sync() {
  const t = useT();
  const patients = useStore((s) => s.patients);
  const syncAll = useStore((s) => s.syncAll);
  const [syncing, setSyncing] = useState(false);
  const pending = patients.filter((p) => !p.synced);

  const start = () => {
    setSyncing(true);
    setTimeout(() => {
      syncAll();
      setSyncing(false);
      toast.success(t.synced);
    }, 1800);
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-10">
      <h1 className="text-3xl font-display text-primary">{t.sync}</h1>
      <p className="text-muted-foreground text-sm">{pending.length} {t.pending}</p>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={start}
        disabled={syncing || pending.length === 0}
        className="mt-6 w-full bg-gradient-primary text-primary-foreground py-5 rounded-3xl font-bold text-lg shadow-mic flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <CloudUpload className={`w-6 h-6 ${syncing ? "animate-bounce" : ""}`} />
        {syncing ? t.syncing : t.syncNow}
      </motion.button>

      <div className="mt-6 space-y-3">
        {patients.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                p.synced ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
              }`}
            >
              {p.synced ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground truncate">{p.symptoms}</div>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                p.synced ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
              }`}
            >
              {p.synced ? "✓" : "•"}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
