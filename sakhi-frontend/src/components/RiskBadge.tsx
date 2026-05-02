import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { useT } from "@/hooks/useT";
import type { Risk } from "@/lib/store";

type Props = {
  risk: Risk;
  size?: "sm" | "md";
};

const config = {
  low: { cls: "risk-low", Icon: ShieldCheck, key: "low" as const },
  medium: { cls: "risk-medium", Icon: Shield, key: "medium" as const },
  high: { cls: "risk-high", Icon: ShieldAlert, key: "high" as const },
};

export default function RiskBadge({ risk, size = "sm" }: Props) {
  const t = useT();
  const { cls, Icon, key } = config[risk];

  if (size === "md") {
    return (
      <motion.div
        key={risk}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${cls} rounded-2xl px-4 py-2 flex items-center gap-2`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-bold">{t[key]}</span>
      </motion.div>
    );
  }

  return (
    <motion.span
      key={risk}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${cls} rounded-full px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1`}
    >
      <Icon className="w-3 h-3" />
      {t[key]}
    </motion.span>
  );
}
