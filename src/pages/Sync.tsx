import { motion } from "framer-motion";
import { useState } from "react";
import { CloudUpload, CheckCircle2, Clock, RefreshCw, Wifi, AlertCircle } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { syncToServer } from "@/services/sync";

export default function Sync() {
  const t = useT();
  const { patients, visits, syncAll, lastSyncTime, failedSyncs, retrySync, settings } = useStore();
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  const pendingPatients = patients.filter((p) => !p.synced);
  const pendingVisits = visits.filter((v) => !v.synced);
  const totalPending = pendingPatients.length + pendingVisits.length;

  const start = async () => {
    setSyncing(true);
    setProgress(0);
    // Animate progress bar while request is in-flight
    const interval = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + 8));
    }, 150);
    try {
      const result = await syncToServer();
      clearInterval(interval);
      setProgress(100);
      syncAll(); // update Zustand store UI state
      setSyncing(false);
      const n = result.saved;
      toast.success(n > 0 ? `Synced ${n} record${n !== 1 ? "s" : ""}` : t.syncSuccess);
    } catch (err: any) {
      clearInterval(interval);
      setProgress(0);
      setSyncing(false);
      toast.error(`Sync failed: ${err?.message ?? "unknown error"}`);
    }
  };

  const handleRetry = () => {
    retrySync();
    toast.success(t.syncSuccess);
  };

  const formatTime = (ts: number | null) => {
    if (!ts) return t.never;
    const d = new Date(ts);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-6">
      <h1 className="text-3xl font-display text-primary">{t.sync}</h1>
      <p className="text-muted-foreground text-sm">{totalPending} {t.pending}</p>

      {/* Last sync */}
      <div className="mt-4 glass-card p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1">
          <div className="text-xs text-muted-foreground font-semibold">{t.lastSynced}</div>
          <div className="font-bold text-foreground">{formatTime(lastSyncTime)}</div>
        </div>
        {settings.syncOnWifiOnly && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wifi className="w-3 h-3" /> WiFi only
          </div>
        )}
      </div>

      {/* Progress bar */}
      {syncing && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{t.syncProgress}</span>
            <span>{Math.min(progress, 100)}%</span>
          </div>
          <div className="progress-bar">
            <motion.div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Sync button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={start}
        disabled={syncing || totalPending === 0}
        className="mt-5 w-full bg-gradient-primary text-primary-foreground py-5 rounded-3xl font-bold text-lg shadow-mic flex items-center justify-center gap-2 disabled:opacity-50 min-tap"
      >
        <CloudUpload className={`w-6 h-6 ${syncing ? "animate-bounce" : ""}`} />
        {syncing ? t.syncing : t.syncNow}
      </motion.button>

      {/* Retry failed */}
      {failedSyncs > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRetry}
          className="mt-3 w-full glass-card p-4 flex items-center justify-center gap-2 border-destructive/30 min-tap"
        >
          <RefreshCw className="w-5 h-5 text-destructive" />
          <span className="font-bold text-destructive">{t.retrySync}</span>
          <span className="text-xs text-muted-foreground ml-1">({failedSyncs} {t.failedUploads})</span>
        </motion.button>
      )}

      {/* Records list */}
      <div className="mt-6 space-y-3">
        {[...pendingVisits.map((v) => ({ id: v.id, label: `Visit - ${v.symptoms?.slice(0, 30)}`, synced: v.synced })),
          ...pendingPatients.map((p) => ({ id: p.id, label: p.name, synced: p.synced })),
          ...patients.filter((p) => p.synced).slice(0, 3).map((p) => ({ id: p.id, label: p.name, synced: true })),
        ].map((item, i) => (
          <motion.div
            key={item.id + i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              item.synced ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
            }`}>
              {item.synced ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground truncate">{item.label}</div>
            </div>
            <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
              item.synced ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
            }`}>
              {item.synced ? "✓" : "•"}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
