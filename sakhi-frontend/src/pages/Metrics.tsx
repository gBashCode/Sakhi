import { motion } from "framer-motion";
import { ArrowLeft, Activity, Clock, Brain, CloudUpload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";

export default function Metrics() {
  const t = useT();
  const nav = useNavigate();
  const { visits, patients } = useStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const visitsToday = visits.filter((v) => v.createdAt >= today.getTime()).length;
  const pendingSyncs = visits.filter((v) => !v.synced).length + patients.filter((p) => !p.synced).length;

  const stats = [
    { icon: Activity, label: t.visitsToday, value: String(visitsToday), color: "text-primary", bg: "bg-primary/10" },
    { icon: Clock, label: t.avgVisitTime, value: `4.2 ${t.minutes}`, color: "text-accent", bg: "bg-accent/15" },
    { icon: Brain, label: t.aiAccuracy, value: "94%", color: "text-success", bg: "bg-success/15" },
    { icon: CloudUpload, label: t.pendingSyncs, value: String(pendingSyncs), color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="min-h-screen pb-32 px-5 pt-6">
      <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap mb-4">
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>

      <h1 className="text-3xl font-display text-primary mb-2">{t.metrics}</h1>
      <p className="text-muted-foreground text-sm mb-6">Admin dashboard</p>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5 text-center"
          >
            <div className={`w-14 h-14 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mx-auto`}>
              <s.icon className="w-7 h-7" />
            </div>
            <div className="text-3xl font-display text-foreground mt-3">{s.value}</div>
            <div className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Summary bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 glass-card p-5"
      >
        <h3 className="font-bold text-foreground mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Patients</span>
            <span className="font-bold text-foreground">{patients.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Visits</span>
            <span className="font-bold text-foreground">{visits.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">High Risk Patients</span>
            <span className="font-bold text-destructive">{patients.filter((p) => p.risk === "high").length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Synced Records</span>
            <span className="font-bold text-success">{visits.filter((v) => v.synced).length}/{visits.length}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
