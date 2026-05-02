import { motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const t = useT();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // Show banner only when truly offline
  const showBanner = !online;

  if (!showBanner) return null;

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      className="offline-banner flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4" />
      <span>{t.offlineBanner}</span>
    </motion.div>
  );
}
