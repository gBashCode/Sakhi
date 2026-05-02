import { motion } from "framer-motion";
import { Home, Bell, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useT } from "@/hooks/useT";

export default function BottomNav() {
  const t = useT();
  const { pathname } = useLocation();
  const tabs = [
    { to: "/home", icon: Home, label: t.home },
    { to: "/alerts", icon: Bell, label: t.alerts },
    { to: "/profile", icon: User, label: t.profile },
  ];
  if (["/", "/language", "/login", "/splash"].includes(pathname)) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-2">
      <div className="mx-auto max-w-md glass-card flex items-center justify-around py-2 px-3">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.92 }}
                className={`relative flex flex-col items-center gap-1 py-2 rounded-2xl ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navpill"
                    className="absolute inset-0 bg-primary/10 rounded-2xl"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className="w-6 h-6 relative" strokeWidth={2.2} />
                <span className="text-[11px] font-semibold relative">{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
