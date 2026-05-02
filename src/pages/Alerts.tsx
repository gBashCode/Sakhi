import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Syringe, Calendar, AlertTriangle, ArrowRight } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";
import OfflineBadge from "@/components/OfflineBadge";

export default function Alerts() {
  const t = useT();
  const nav = useNavigate();
  const patients = useStore((s) => s.patients);
  const now = Date.now();
  const DAY = 86400000;

  // Build reminders from patient due items
  const reminders = patients.flatMap((p) =>
    (p.dueItems || []).map((d) => {
      const daysLeft = Math.floor((d.dueDate - now) / DAY);
      const tintKey = daysLeft < 0 ? "destructive" : daysLeft === 0 ? "accent" : "primary";
      const whenLabel = daysLeft < 0 ? `${t.missed} ${Math.abs(daysLeft)} ${t.days}` : daysLeft === 0 ? t.dueToday : `${t.dueIn} ${daysLeft} ${t.days}`;
      const Icon = d.type === "vaccine" ? Syringe : d.type === "followup" ? AlertTriangle : Calendar;
      return { icon: Icon, title: `${p.name} — ${d.label}`, when: whenLabel, tint: tintKey, patientId: p.id, daysLeft };
    })
  ).sort((a, b) => a.daysLeft - b.daysLeft);

  const tintMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-accent/15 text-accent border-accent/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
  };

  const urgencyBorder: Record<string, string> = {
    primary: "",
    accent: "due-today",
    destructive: "due-overdue",
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-display text-primary">{t.reminders}</h1>
          <p className="text-muted-foreground text-sm">{t.upcoming} & {t.missed}</p>
        </div>
        <OfflineBadge />
      </div>

      <div className="space-y-3">
        {reminders.map((r, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => nav(`/visit/${r.patientId}`)}
            className={`w-full glass-card p-4 flex items-center gap-4 text-left ${urgencyBorder[r.tint] || ""}`}
          >
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${tintMap[r.tint]}`}>
              <r.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground truncate">{r.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.when}</div>
            </div>
            <div className="bg-gradient-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 min-tap shrink-0">
              {t.startVisit} <ArrowRight className="w-3 h-3" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
