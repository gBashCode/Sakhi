import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Home, Baby, Syringe, ClipboardList, Activity, 
  HeartHandshake, HeartPulse, UserCircle 
} from "lucide-react";

const formTypes = [
  { id: "demographic", title: "Household Details", desc: "Family ID, Caste, BPL, Members", icon: Home, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "maternal", title: "Maternal Health", desc: "ANC, LMP, EDD, TT, IFA Tracking", icon: Baby, color: "text-pink-500", bg: "bg-pink-50" },
  { id: "child", title: "Child Health", desc: "Immunization, Growth, Malnutrition", icon: Syringe, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "daily", title: "Daily Visits", desc: "Home visits, Counseling provided", icon: ClipboardList, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "disease", title: "Disease Surveillance", desc: "Fever, Cough, Diarrhea, Outbreaks", icon: Activity, color: "text-red-500", bg: "bg-red-50" },
  { id: "family_planning", title: "Family Planning", desc: "Contraceptive use, Sterilization", icon: HeartHandshake, color: "text-purple-500", bg: "bg-purple-50" },
  { id: "ncd", title: "NCDs", desc: "Hypertension, Diabetes screening", icon: HeartPulse, color: "text-teal-500", bg: "bg-teal-50" },
  { id: "patient", title: "Individual Record", desc: "Specific patient symptoms & follow-up", icon: UserCircle, color: "text-indigo-500", bg: "bg-indigo-50" },
];

export default function FormSelection() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen pb-32 px-5 pt-6 bg-[#f8fafc]">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => nav(-1)} className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center min-tap shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Select Form</h1>
          <p className="text-xs text-slate-500">Choose the category of data to record</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {formTypes.map((form, i) => {
          const Icon = form.icon;
          return (
            <motion.button
              key={form.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => nav(`/voice?type=${form.id}&title=${encodeURIComponent(form.title)}`)}
              className="glass-card p-4 flex items-center gap-4 text-left shadow-sm border border-slate-100 hover:border-slate-300 transition-colors"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${form.bg}`}>
                <Icon className={`w-7 h-7 ${form.color}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{form.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{form.desc}</p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  );
}
