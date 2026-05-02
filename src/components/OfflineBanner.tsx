import { WifiOff } from "lucide-react";
import { motion } from "framer-motion";

/**
 * OfflineBanner — sticky top bar shown when navigator.onLine is false.
 * Rendered in App.tsx via a state listener, not via navigator.onLine directly
 * (since that value is stale on first render).
 */
export default function OfflineBanner() {
  return (
    <motion.div
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -48, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-bold py-2 px-4 shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You're offline — visits save locally and sync when back online</span>
    </motion.div>
  );
}
