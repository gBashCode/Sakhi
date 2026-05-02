import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Syringe, Calendar, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useT } from "@/hooks/useT";
import OfflineBadge from "@/components/OfflineBadge";
import { api } from "@/lib/api";

type DueItem = {
  id: string;
  title: string;
  when: string;
  type: "vaccine" | "anc" | "risk" | "missed";
};

// Fallback demo data when backend is offline
const FALLBACK: DueItem[] = [
  { id: "1", title: "Baby Arjun — DPT-2", when: "in 3 days", type: "vaccine" },
  { id: "2", title: "Sunita — ANC visit", when: "Tomorrow", type: "anc" },
  { id: "3", title: "Lakshmi — High-risk follow-up", when: "Today", type: "risk" },
  { id: "4", title: "Baby Riya — BCG", when: "Missed 2 days ago", type: "missed" },
  { id: "5", title: "Meena — Iron supplement check", when: "in 5 days", type: "anc" },
];

const typeConfig: Record<DueItem["type"], { icon: any; tint: string }> = {
  vaccine: { icon: Syringe,       tint: "bg-accent/15 text-accent border-accent/30" },
  anc:     { icon: Calendar,      tint: "bg-primary/10 text-primary border-primary/20" },
  risk:    { icon: AlertTriangle, tint: "bg-destructive/10 text-destructive border-destructive/30" },
  missed:  { icon: AlertTriangle, tint: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default function Alerts() {
  const t = useT();
  const [dueList, setDueList] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDue = async () => {
      try {
        const res = await api.get("/api/v1/patients/due");
        setDueList(res.data);
      } catch (err) {
        console.warn("Due list fetch failed, using fallback:", err);
        setDueList(FALLBACK);
      } finally {
        setLoading(false);
      }
    };
    fetchDue();
  }, []);

  return (
    <div className="min-h-screen pb-32 px-5 pt-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-primary">{t.reminders}</h1>
          <p className="text-muted-foreground text-sm">{t.upcoming} &amp; {t.missed}</p>
        </div>
        <OfflineBadge />
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          dueList.map((r, i) => {
            const { icon: Icon, tint } = typeConfig[r.type] ?? typeConfig.anc;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${tint}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.when}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
