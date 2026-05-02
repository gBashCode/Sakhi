import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, KeyRound, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export default function AdminLogin() {
  const navigate = useNavigate();
  const setAdminLoggedIn = useStore(s => s.setAdminLoggedIn);
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminId !== "8585858585") {
      toast.error("Invalid Admin ID. Try 8585858585.");
      return;
    }
    if (password === "8585") {
      toast.success("Verified successfully");
      setAdminLoggedIn(true);
      navigate("/admin/dashboard");
    } else {
      toast.error("Invalid password. Try '8585'.");
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f8fafc] p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-blue-50/50 to-purple-50/50 z-0"></div>
      
      <div className="glass-card w-full max-w-md p-10 relative z-10 shadow-xl border border-white/60">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-slate-900">Admin Portal</h1>
            <p className="text-slate-500 mt-2 text-sm">Secure access for state health coordinators</p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-700">Admin ID</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input 
                    type="text" 
                    placeholder="Enter your Admin ID" 
                    className="pl-10 h-12 bg-white/70"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-slate-700">Password / PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="Enter your Password" 
                    className="pl-10 h-12 bg-white/70 tracking-widest text-lg font-bold"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-bold mt-2">Login Securely</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
