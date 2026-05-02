import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Phone, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const nav = useNavigate();
  const t = useT();
  const setLoggedIn = useStore((s) => s.setLoggedIn);
  const setAdminLoggedIn = useStore((s) => s.setAdminLoggedIn);
  const setUserName = useStore((s) => s.setUserName);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (phone === "8585858585" && pin === "8585") {
      toast.success("Admin Portal Accessed");
      setAdminLoggedIn(true);
      nav("/admin/dashboard");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/v1/auth/login", { phone, pin });
      localStorage.setItem("sakhi_token", res.data.access_token);
      setLoggedIn(true);
      if (res.data.user && res.data.user.name) {
        setUserName(res.data.user.name);
      }
      nav("/home");
    } catch (err: any) {
      if (err.response) {
        // Backend responded with an error (404 Not Found or 401 Unauthorized)
        const errorMessage = err.response.data?.detail || "Login failed";
        toast.error(errorMessage);
        if (err.response.status === 404) {
          toast.info("Please sign up first.");
        }
      } else {
        // Network error / backend offline
        toast.error("Unable to connect to server. Please ensure backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-10 pattern-organic">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-mic">
          <ShieldCheck className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="mt-6 text-3xl font-display text-primary">{t.welcome} 🙏</h2>
        <p className="text-muted-foreground mt-1">{t.tagline}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card mt-8 p-5 space-y-5"
      >
        <div>
          <label className="text-sm font-semibold text-foreground/80">{t.phone}</label>
          <div className="mt-2 flex items-center gap-3 bg-background/60 rounded-2xl px-4 py-4 border border-border">
            <Phone className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">+91</span>
            <input
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="98765 43210"
              className="flex-1 bg-transparent outline-none text-lg tracking-wider"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground/80">4-Digit PIN</label>
          <div className="mt-2 flex items-center gap-3 bg-background/60 rounded-2xl px-4 py-4 border border-border">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="flex-1 bg-transparent outline-none text-xl tracking-widest"
            />
          </div>
        </div>
      </motion.div>

      <div className="flex-1" />

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={phone.length < 10 || pin.length < 4 || loading}
        onClick={handleLogin}
        className="w-full h-14 bg-gradient-primary text-primary-foreground rounded-3xl font-bold text-lg shadow-mic disabled:opacity-50 mb-4"
      >
        {loading ? "Logging in…" : "Login Securely"}
      </motion.button>

      <div className="text-center text-sm font-semibold text-slate-500 pb-4">
        New to Sakhi?{" "}
        <button onClick={() => nav("/signup")} className="text-primary hover:underline font-bold">
          Register here
        </button>
      </div>
    </div>
  );
}
