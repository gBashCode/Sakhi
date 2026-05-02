import { motion } from "framer-motion";
import { Syringe, Calendar, AlertTriangle, ArrowRight } from "lucide-react";
import { useT } from "@/hooks/useT";
import OfflineBadge from "@/components/OfflineBadge";

const reminders = [
  { icon: Syringe, title: "Baby Arjun — DPT-2", when: "in 3 days", type: "vaccine", tint: "accent" },
  { icon: Calendar, title: "Sunita — ANC visit", when: "Tomorrow", type: "anc", tint: "primary" },
  { icon: AlertTriangle, title: "Lakshmi — High-risk follow-up", when: "Today", type: "risk", tint: "destructive" },
  { icon: Syringe, title: "Baby Riya — BCG", when: "Missed 2 days ago", type: "missed", tint: "destructive" },
  { icon: Calendar, title: "Meena — Iron supplement check", when: "in 5 days", type: "anc", tint: "primary" },
];

const tintMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-accent/15 text-accent border-accent/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function Alerts() {
  const t = useT();
  return (
    <div className="min-h-screen pb-32 px-5 pt-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-primary">{t.reminders}</h1>
          <p className="text-muted-foreground text-sm">{t.upcoming} & {t.missed}</p>
        </div>
        <OfflineBadge />
      </div>

      <div className="mt-6 space-y-3">
        {reminders.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${tintMap[r.tint]}`}>
              <r.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground truncate">{r.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.when}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
