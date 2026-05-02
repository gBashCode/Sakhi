import { motion } from "framer-motion";
import { FolderSearch } from "lucide-react";

type Props = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ message, actionLabel, onAction }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-muted/60 flex items-center justify-center mb-5">
        <FolderSearch className="w-10 h-10 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-semibold text-lg">{message}</p>
      {actionLabel && onAction && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="mt-5 bg-gradient-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-sm min-tap"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
