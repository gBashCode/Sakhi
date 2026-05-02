import { motion } from "framer-motion";
import { Home, Bell, User, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useT } from "@/hooks/useT";
import { useStore } from "@/lib/store";

export default function BottomNav() {
  const t = useT();
  const { pathname } = useLocation();
  const pending = useStore((s) => s.patients.filter((p) => !p.synced).length + s.visits.filter((v) => !v.synced).length);

  const tabs = [
    { to: "/home", icon: Home, label: t.home },
    { to: "/patients", icon: Users, label: t.patients },
    { to: "/alerts", icon: Bell, label: t.alerts, badge: 0 },
    { to: "/profile", icon: User, label: t.profile },
  ];

  const hiddenPaths = ["/", "/language", "/login", "/signup", "/splash", "/high-risk-alert"];
  if (hiddenPaths.includes(pathname)) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-2">
      <div className="mx-auto max-w-md glass-card flex items-center justify-around py-2 px-3">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.92 }}
                className={`relative flex flex-col items-center gap-1 py-2 rounded-2xl min-tap ${
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
                <div className="relative">
                  <Icon className="w-6 h-6 relative" strokeWidth={2.2} />
                  {/* Sync badge on Patients tab */}
                  {to === "/patients" && pending > 0 && (
                    <span className="absolute -top-1 -right-2 bg-accent text-accent-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {pending > 9 ? "9+" : pending}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold relative">{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
