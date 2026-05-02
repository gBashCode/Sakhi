import { motion } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";

export default function OfflineBadge() {
  const t = useT();
  const pending = useStore((s) => s.patients.filter((p) => !p.synced).length);
  const online = false; // simulated offline-first

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border ${
        online
          ? "bg-success/10 text-success border-success/30"
          : "bg-accent/10 text-accent border-accent/30"
      }`}
    >
      {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
      <span>{online ? t.online : t.offline}</span>
      {!online && pending > 0 && (
        <span className="ml-1 bg-accent text-accent-foreground rounded-full px-2 py-0.5">
          {pending}
        </span>
      )}
    </motion.div>
  );
}
