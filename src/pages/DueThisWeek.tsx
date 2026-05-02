import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Syringe, Heart, Pill, ArrowRight } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";
import OfflineBadge from "@/components/OfflineBadge";
import EmptyState from "@/components/EmptyState";

const typeIcons: Record<string, any> = { anc: Calendar, vaccine: Syringe, followup: Heart, iron: Pill };

export default function DueThisWeek() {
  const t = useT();
  const nav = useNavigate();
  const patients = useStore((s) => s.patients);
  const now = Date.now();
  const DAY = 86400000;

  const dueList = useMemo(() => {
    const items: { patient: typeof patients[0]; due: NonNullable<typeof patients[0]["dueItems"]>[0]; daysLeft: number }[] = [];
    patients.forEach((p) => {
      p.dueItems?.forEach((d) => {
        const daysLeft = Math.floor((d.dueDate - now) / DAY);
        if (daysLeft <= 7) items.push({ patient: p, due: d, daysLeft });
      });
    });
    return items.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [patients, now]);

  const urgency = (days: number) => {
    if (days < 0) return { cls: "due-overdue", label: t.overdue, labelCls: "text-destructive" };
    if (days === 0) return { cls: "due-today", label: t.dueToday, labelCls: "text-accent" };
    return { cls: "due-soon", label: `${t.dueIn} ${days} ${t.days}`, labelCls: "text-warning" };
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-display text-primary">{t.dueThisWeek}</h1>
          <p className="text-muted-foreground text-sm">{dueList.length} {t.pending}</p>
        </div>
        <OfflineBadge />
      </div>

      {dueList.length === 0 ? (
        <EmptyState message={t.noDue} />
      ) : (
        <div className="space-y-3">
          {dueList.map((item, i) => {
            const u = urgency(item.daysLeft);
            const Icon = typeIcons[item.due.type] || Calendar;
            return (
              <motion.div
                key={`${item.patient.id}-${item.due.label}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass-card p-4 ${u.cls}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground truncate">{item.patient.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{item.due.label}</div>
                    <div className={`text-xs font-bold mt-1 ${u.labelCls}`}>{u.label}</div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => nav(`/visit/${item.patient.id}`)}
                    className="bg-gradient-primary text-primary-foreground px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-1 min-tap shrink-0"
                  >
                    {t.startVisit} <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
