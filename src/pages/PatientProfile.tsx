import { motion } from "framer-motion";
import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Calendar, MapPin, Baby, Clock, Activity } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useStore, type Visit } from "@/lib/store";
import RiskBadge from "@/components/RiskBadge";
import ActionCard from "@/components/ActionCard";
import EmptyState from "@/components/EmptyState";

export default function PatientProfile() {
  const t = useT();
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const patients = useStore((s) => s.patients);
  const allVisits = useStore((s) => s.visits);
  const markReferred = useStore((s) => s.markReferred);
  const patient = useMemo(() => patients.find((p) => p.id === id), [patients, id]);
  const visits = useMemo(() => allVisits.filter((v) => v.patientId === id), [allVisits, id]);

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState message="Patient not found" actionLabel={t.home} onAction={() => nav("/home")} />
      </div>
    );
  }

  const DAY = 86400000;
  const now = Date.now();
  const daysAgo = (ts: number) => {
    const d = Math.floor((now - ts) / DAY);
    return d === 0 ? t.today : `${d} ${t.daysAgo}`;
  };

  return (
    <div className="min-h-screen pb-32 px-5 pt-6">
      {/* Back */}
      <button
        onClick={() => nav(-1)}
        className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap mb-4"
      >
        <ArrowLeft className="w-5 h-5 text-primary" />
      </button>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
        <div className="w-20 h-20 rounded-3xl bg-gradient-primary mx-auto flex items-center justify-center shadow-mic">
          <User className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="mt-3 text-2xl font-display text-foreground">{patient.name}</div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <RiskBadge risk={patient.risk} size="md" />
          {patient.referred && (
            <span className="bg-success/15 text-success border border-success/30 rounded-full px-3 py-1 text-xs font-bold">
              {t.referred}
            </span>
          )}
        </div>
      </motion.div>

      {/* Details */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="mt-4 space-y-3"
      >
        <InfoRow icon={Calendar} label={t.age} value={`${patient.age} years`} />
        {patient.village && <InfoRow icon={MapPin} label={t.village} value={patient.village} />}
        {patient.pregnancyMonth && (
          <InfoRow icon={Baby} label={t.pregnancy} value={`${patient.pregnancyMonth} ${t.months}`} />
        )}
        {patient.lmp && <InfoRow icon={Calendar} label={t.lmp} value={patient.lmp} />}
        {patient.edd && <InfoRow icon={Calendar} label={t.edd} value={patient.edd} />}
      </motion.div>

      {/* Action card for high risk */}
      {patient.risk === "high" && !patient.referred && (
        <div className="mt-5">
          <ActionCard
            patientContext={`${patient.name} | ${patient.pregnancyMonth || ""} ${t.months} | ${patient.symptoms}`}
            action={patient.recommendation}
            explanation={`BP readings and symptoms (${patient.symptoms}) during pregnancy indicate elevated risk. Immediate referral to PHC recommended per ASHA protocol.`}
            onDone={() => markReferred(patient.id)}
            onSnooze={() => {}}
          />
        </div>
      )}

      {/* Visit history */}
      <div className="mt-6">
        <h2 className="text-xl font-display text-foreground mb-3">{t.visitHistory}</h2>
        {visits.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-muted-foreground">{t.noVisits}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v, i) => (
              <VisitCard key={v.id} visit={v} daysAgo={daysAgo(v.createdAt)} delay={i * 0.06} />
            ))}
          </div>
        )}
      </div>

      {/* New Visit CTA */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => nav(`/visit/${patient.id}`)}
        className="mt-5 w-full bg-gradient-primary text-primary-foreground py-5 rounded-3xl font-bold text-lg shadow-mic flex items-center justify-center gap-2 min-tap"
      >
        {t.newVisitBtn}
      </motion.button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      className="glass-card p-4 flex items-center gap-3"
    >
      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{label}</div>
        <div className="font-bold text-foreground truncate">{value}</div>
      </div>
    </motion.div>
  );
}

function VisitCard({ visit, daysAgo, delay }: { visit: Visit; daysAgo: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-4 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-semibold">{daysAgo}</span>
        </div>
        <RiskBadge risk={visit.risk} />
      </div>
      <div className="flex items-center gap-4 text-sm">
        {visit.bpSys && (
          <span className="text-foreground">
            <span className="text-muted-foreground">BP:</span> {visit.bpSys}/{visit.bpDia}
          </span>
        )}
        {visit.weight && (
          <span className="text-foreground">
            <span className="text-muted-foreground">Wt:</span> {visit.weight}kg
          </span>
        )}
      </div>
      <div className="flex items-start gap-2">
        <Activity className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-foreground">{visit.symptoms}</p>
      </div>
    </motion.div>
  );
}
