import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { ArrowLeft, Calendar, Activity, Heart, AlertTriangle, CheckCircle2, Download, History, User } from "lucide-react";
import RiskBadge from "@/components/RiskBadge";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const t = useT();
  const patient = useStore((s) => s.patients.find((p) => p.id === id));
  const [visits, setVisits] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      db.visits.where('patientId').equals(id).reverse().sortBy('deviceTs').then(setVisits);
    }
  }, [id]);

  if (!patient) return null;

  return (
    <div className="min-h-screen pb-32 px-5 pt-6 pattern-organic">
      <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap mb-4">
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>

      {/* Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border-b-4 border-primary"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-display">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-display text-foreground leading-tight">{patient.name}</h1>
              <p className="text-sm text-muted-foreground">{patient.age} years • {patient.village || 'Tumkur'}</p>
            </div>
          </div>
          <RiskBadge risk={patient.risk} size="lg" />
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="glass-card p-4">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Visits</div>
          <div className="text-2xl font-display text-primary">{visits.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Last Visit</div>
          <div className="text-sm font-bold text-foreground">
            {visits[0] ? new Date(visits[0].deviceTs).toLocaleDateString() : 'None'}
          </div>
        </div>
      </div>

      {/* Visit History Section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display text-foreground">Visit History</h2>
        </div>

        <div className="space-y-4">
          {visits.map((v, i) => (
            <motion.div 
              key={v.clientId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card overflow-hidden"
            >
              <div className="bg-slate-50/50 px-4 py-3 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground">
                    {new Date(v.deviceTs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <RiskBadge risk={v.riskLevel} />
              </div>

              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase">BP</div>
                    <div className="text-sm font-bold">{v.bpSys || '?'}/{v.bpDia || '?'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase">Weight</div>
                    <div className="text-sm font-bold">{v.weight || '?'} kg</div>
                  </div>
                </div>
                
                {v.symptoms && (
                  <div className="col-span-2 pt-2 border-t border-border">
                    <div className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Symptoms Detected by AI</div>
                    <div className="flex flex-wrap gap-1">
                      {v.symptoms.split(',').map((s: string) => (
                        <span key={s} className="bg-secondary/50 text-foreground px-2 py-0.5 rounded-md text-[10px] font-semibold border border-border">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => nav(`/visit/${id}`)}
        className="mt-8 w-full bg-gradient-primary text-primary-foreground py-5 rounded-3xl font-bold text-lg shadow-mic flex items-center justify-center gap-2 min-tap"
      >
        <Activity className="w-5 h-5" /> Start New Visit
      </motion.button>
    </div>
  );
}
