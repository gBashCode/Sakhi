import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight, CloudUpload } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";
import RiskBadge from "@/components/RiskBadge";
import EmptyState from "@/components/EmptyState";
import OfflineBadge from "@/components/OfflineBadge";
import { syncToServer } from "@/services/sync";
import { toast } from "sonner";

type Tab = "all" | "due" | "high";

export default function Patients() {
  const t = useT();
  const nav = useNavigate();
  const patients = useStore((s) => s.patients);
  const syncAll = useStore((s) => s.syncAll);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncToServer();
      syncAll();
      const n = result.saved;
      toast.success(n > 0 ? `Synced ${n} record${n !== 1 ? "s" : ""}` : "Nothing new to sync");
    } catch (err: any) {
      toast.error(`Sync failed: ${err?.message ?? "unknown"}`);
    } finally {
      setSyncing(false);
    }
  };

  const now = Date.now();
  const DAY = 86400000;

  const filtered = useMemo(() => {
    let list = patients;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Tab filter
    if (tab === "due") {
      list = list.filter((p) =>
        p.dueItems?.some((d) => d.dueDate <= now + 7 * DAY)
      );
    } else if (tab === "high") {
      list = list.filter((p) => p.risk === "high");
    }

    return list;
  }, [patients, search, tab, now]);

  const daysAgo = (ts?: number) => {
    if (!ts) return "";
    const d = Math.floor((now - ts) / DAY);
    return d === 0 ? t.today : `${d} ${t.daysAgo}`;
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-display text-primary">{t.patients}</h1>
          <p className="text-muted-foreground text-sm">{patients.length} {t.records}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-2 rounded-2xl text-xs font-bold disabled:opacity-50 min-tap"
            title="Sync Now"
          >
            <CloudUpload className={`w-4 h-4 ${syncing ? "animate-bounce" : ""}`} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
          <OfflineBadge />
        </div>
      </div>

      {/* Search */}
      <div className="search-bar mb-4">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPatient}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {([
          { key: "all" as Tab, label: t.all },
          { key: "due" as Tab, label: t.due },
          { key: "high" as Tab, label: t.highRisk },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setTab(f.key)}
            className={`filter-tab whitespace-nowrap ${
              tab === f.key ? "filter-tab-active" : "filter-tab-inactive"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Patient list */}
      {filtered.length === 0 ? (
        <EmptyState
          message={t.noPatients}
          actionLabel={t.addPatient}
          onAction={() => nav("/voice")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => nav(`/patient/${p.id}`)}
              className="w-full glass-card p-4 flex items-center gap-3 text-left"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-lg font-display">
                {p.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground truncate">{p.name}</span>
                  <RiskBadge risk={p.risk} />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t.age}: {p.age} • {t.lastVisit}: {daysAgo(p.lastVisit)}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </motion.button>
          ))}
        </div>
      )}

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => nav("/voice")}
        className="fab"
        aria-label={t.newPatient}
      >
        <Plus className="w-7 h-7 text-primary-foreground" />
      </motion.button>
    </div>
  );
}
