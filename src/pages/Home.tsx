import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Bell, AlertTriangle, CloudUpload, Users, Syringe, ShieldAlert } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";
import OfflineBadge from "@/components/OfflineBadge";
import { db } from "@/lib/db";

export default function Home() {
  const nav = useNavigate();
  const t = useT();
  const patients = useStore((s) => s.patients);
  const setPatients = useStore((s) => s.setPatients);
  const pending = patients.filter((p) => !p.synced).length;
  const highRisk = patients.filter((p) => p.risk === "high").length;

  // Load from IndexedDB on mount (offline-first)
  useEffect(() => {
    const loadLocal = async () => {
      const local = await db.patients.toArray();
      if (local.length > 0) {
        setPatients(
          local.map((p) => ({ ...p, synced: p.synced === 1 }))
        );
      }
    };
    loadLocal();
  }, [setPatients]);

  const stats = [
    { icon: Users, label: t.visited, value: patients.length, tint: "text-primary" },
    { icon: Syringe, label: t.vaccines, value: 5, tint: "text-accent" },
    { icon: ShieldAlert, label: t.risks, value: highRisk, tint: "text-destructive" },
  ];

  return (
    <div className="min-h-screen pb-32 px-5 pt-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{t.welcome},</p>
          <h1 className="text-3xl font-display text-primary">Asha Didi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t.asha} • Tumkur</p>
        </div>
        <OfflineBadge />
      </div>

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="mt-6 grid grid-cols-3 gap-3"
      >
        {stats.map((s, i) => (
          <motion.div
            key={i}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="glass-card p-3 text-center"
          >
            <s.icon className={`w-5 h-5 mx-auto ${s.tint}`} />
            <div className="text-2xl font-display text-foreground mt-1">{s.value}</div>
            <div className="text-[11px] text-muted-foreground font-semibold">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Hero — New Visit */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => nav("/voice")}
        className="mt-5 w-full relative overflow-hidden rounded-3xl bg-gradient-primary p-6 text-left shadow-mic"
      >
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="absolute right-6 top-6 w-16 h-16 rounded-2xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center animate-float">
          <Mic className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="text-primary-foreground/80 text-xs font-semibold tracking-wider uppercase">
          {t.today}
        </div>
        <div className="text-primary-foreground text-2xl font-display mt-1 leading-tight max-w-[70%]">
          {t.newVisit}
        </div>
        <div className="text-primary-foreground/85 text-sm mt-1 max-w-[70%]">
          {t.newVisitDesc}
        </div>
      </motion.button>

      {/* Action grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ActionCard
          icon={Bell}
          title={t.followUps}
          value={`4 ${t.pending}`}
          tint="accent"
          onClick={() => nav("/alerts")}
          delay={0.3}
        />
        <ActionCard
          icon={AlertTriangle}
          title={t.highRisk}
          value={`${highRisk} ${t.pending}`}
          tint="destructive"
          onClick={() => nav("/alerts")}
          delay={0.36}
        />
        <ActionCard
          icon={CloudUpload}
          title={t.sync}
          value={`${pending} ${t.pending}`}
          tint="primary"
          onClick={() => nav("/sync")}
          delay={0.42}
          full
        />
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  value,
  tint,
  onClick,
  delay,
  full,
}: {
  icon: any;
  title: string;
  value: string;
  tint: "primary" | "accent" | "destructive";
  onClick: () => void;
  delay: number;
  full?: boolean;
}) {
  const tintMap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`glass-card p-4 text-left ${full ? "col-span-2" : ""}`}
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tintMap[tint]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="mt-3 text-sm font-bold text-foreground leading-tight">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{value}</div>
    </motion.button>
  );
}
