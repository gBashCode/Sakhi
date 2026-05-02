import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Phone, KeyRound, Loader2, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SignUp() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    confirmPin: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.phone.length < 10 || formData.pin.length < 4) {
      toast.error("Please fill in all fields correctly.");
      return;
    }
    if (formData.pin !== formData.confirmPin) {
      toast.error("PINs do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          pin: formData.pin
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      toast.success("Registration successful!");
      // Automatically redirect to login page after signing up
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] p-6 relative">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10 space-y-8">
        
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <HeartPulse className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-800">Join Sakhi</h1>
          <p className="text-slate-500">Create your ASHA worker account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="e.g. Sunita Devi"
                  className="pl-10 h-12 bg-white/70"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="tel"
                  placeholder="10-digit mobile number"
                  className="pl-10 h-12 bg-white/70"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">4-Digit PIN</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  className="pl-10 h-12 bg-white/70 tracking-widest text-lg"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Confirm PIN</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  className="pl-10 h-12 bg-white/70 tracking-widest text-lg"
                  value={formData.confirmPin}
                  onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value })}
                  maxLength={4}
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
          </Button>
        </form>

        <div className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
