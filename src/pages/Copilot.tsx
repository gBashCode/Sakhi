import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Send } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ── 100% OFFLINE Medical Knowledge Base ──────────────────────────────────────
// No internet. No backend. Pure rule-based responses from MoHFW ANC Guidelines.
function getOfflineReply(message: string): string {
  const q = message.toLowerCase();

  // Blood Pressure / Hypertension
  if (/bp|blood pressure|hypertension|hadbaad|rakta chap/.test(q)) {
    if (/high|zyada|140|150|160|danger/.test(q))
      return "⚠️ BP 140/90 ya zyada hone par HIGH RISK hai. Aaj hi PHC bhejo. 108 call karo agar sir dard ya sujan ho. Ye pre-eclampsia ka nishan ho sakta hai.";
    if (/normal|thik|safe/.test(q))
      return "✅ Normal BP 110/70 se 130/80 ke beech hona chahiye. Har visit me check karo.";
    return "🩺 MoHFW guideline: BP 140/90 ya usse zyada = HIGH RISK. 130-139 = MEDIUM RISK. Usse kam = Normal. Har ANC visit me BP check karo.";
  }

  // Anemia / Hemoglobin
  if (/anemia|hemoglobin|hb|khoon|pallor|pale/.test(q)) {
    return "🩸 Hb 7g/dL se kam = Severe anemia → PHC refer karo. 7-10 = Moderate → IFA double dose. 10+ = Normal. IFA tablet roz do — ek hafte me farq dikhega. Conjunctival pallor check karo.";
  }

  // IFA Tablets
  if (/ifa|iron|folic|goli|tablet/.test(q)) {
    return "💊 IFA (Iron-Folic Acid): Pehli trimester se shuru karo. Roz ek goli raat ko khana khane ke baad. 180 goli total pregnancy me. Side effects: kaala mal — ye normal hai. Khali pet nahi.";
  }

  // TT Vaccine / Tetanus
  if (/tt|tetanus|tika|vaccine|injection/.test(q)) {
    return "💉 TT Vaccine: TT-1 pehli visit me. TT-2 TT-1 ke 4 hafte baad ya 36 week tak. PHC ya sub-centre me free milti hai. Har pregnancy me dono dose zaroori hain.";
  }

  // Edema / Swelling
  if (/edema|swelling|sujan|soojan|phool|pair/.test(q)) {
    return "⚠️ Pair me sujan (edema) + high BP = Pre-eclampsia suspect. TURANT PHC le jao. Chehre ya haath me sujan = Emergency. Sirf pair me halki sujan = Monitor karo, namak kam karo.";
  }

  // Bleeding
  if (/bleed|khoon|rakt|spotting|discharge/.test(q)) {
    return "🚨 EMERGENCY: Pregnancy me koi bhi bleeding = 108 call karo ABHI. PHC ya hospital le jao. Koi bhi delay nahi. Ye placenta previa ya abruptio ho sakta hai.";
  }

  // Headache
  if (/headache|sir dard|sir me dard|sirdard/.test(q)) {
    return "⚠️ BP check karo. Agar BP high hai + sir dard = Pre-eclampsia. Turant PHC le jao. Agar BP normal = Rest karo, paani piyo. Agar nahi sudhra = Doctor se milo.";
  }

  // Vomiting / Nausea
  if (/vomit|ulti|matli|nausea|sick/.test(q)) {
    return "🤢 Pehli trimester me halki ulti normal hai. Thoda thoda khana do din me 6 baar. Paani zyada piyo. Agar bahut zyada ulti = Hyperemesis → PHC le jao.";
  }

  // Weight / Nutrition
  if (/weight|vajan|nutrition|khana|diet|food/.test(q)) {
    return "⚖️ Pregnancy me 11-13 kg weight badhna chahiye. 40kg se kam = Low weight risk. Roz dal, sabzi, doodh, anda do. Har visit me weight check karo. IFA + Calcium dono do.";
  }

  // LMP / EDD / Gestational Age
  if (/lmp|edd|due date|weeks|trimester|mahine|delivery/.test(q)) {
    return "📅 EDD = LMP + 280 din (40 hafte). First trimester = 0-13 weeks, Second = 14-26, Third = 27-40. 37 hafte se pehle delivery = Preterm risk. 34 weeks ke baad PHC delivery better hai.";
  }

  // ANC Visits / Schedule
  if (/anc|visit|check.?up|schedule|kitni baar|how many/.test(q)) {
    return "📋 MoHFW ANC Schedule:\n• Pehla visit: Pregnancy pata chalne par (8-12 weeks)\n• Doosra: 14-20 weeks\n• Teesra: 28-32 weeks\n• Chautha: 36-40 weeks\nKam se kam 4 visits zaroori hain.";
  }

  // Danger signs
  if (/danger|emergency|khatre|red flag|sign/.test(q)) {
    return "🚨 KHATRE KE NISHAN — Turant PHC/108:\n• BP 140/90+\n• Koi bhi bleeding\n• Bahut tez sir dard\n• Aankhon me dhundla dikhna\n• Bahut zyada sujan\n• Baby hilna band ho jaye\n• Bukhar 38°C+\n• Ulti nahi ruk rahi";
  }

  // Calcium
  if (/calcium|haddi|bone|milk|doodh/.test(q)) {
    return "🦴 Calcium 500mg roz — 2nd trimester se. IFA ke saath nahi dena (alag alag time do). Doodh, paneer, til, ragi se bhi milta hai. Pre-eclampsia risk kam karta hai.";
  }

  // Fever / Malaria
  if (/fever|bukhar|malaria|temperature/.test(q)) {
    return "🌡️ 38°C+ bukhar = PHC le jao. Malaria test karo (RDT). Pregnancy me paracetamol safe hai — aspirin/ibuprofen NAHI. Dengue zyada khatra deta hai.";
  }

  // Baby movement / kicks
  if (/movement|kick|hilna|baby move|fetal/.test(q)) {
    return "👶 28 weeks ke baad baby ko 2 ghante me 10 baar hilna chahiye. Hilna kam lage = Turant PHC. ASHA ko sikhao: 'Kick count' track karna. Daily check karo.";
  }

  // Delivery / labor
  if (/delivery|prasav|dard|labor|pain|contractions/.test(q)) {
    return "🏥 Institutional delivery prefer karo. 5 minute me ek dard aaye 30 second tak = Active labor. PHC ya hospital le jao. Ghar me delivery = RISK. 108 call karo.";
  }

  // Greetings
  if (/hello|hi|hii|namaste|namaskar|hey/.test(q)) {
    return "🙏 Namaste! Main Sakhi AI Copilot hoon. MoHFW ANC guidelines ke hisaab se help karti hoon — 100% offline. BP, anemia, danger signs, ANC schedule — kuch bhi poochho!";
  }

  // Default
  return `🤝 Samajh nahi paya. Ye topics pooch sakte ho:\n• BP / Hypertension\n• Anemia / Hb\n• IFA tablet\n• TT vaccine\n• Sujan / Edema\n• Bleeding\n• ANC visit schedule\n• Khatre ke nishan\n• Delivery`;
}

export default function Copilot() {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "🙏 Namaste! Main Sakhi AI Copilot hoon — 100% offline kaam karti hoon.\n\nMoHFW ANC guidelines ke hisaab se help karti hoon. BP, anemia, IFA, TT vaccine, khatre ke nishan — kuch bhi poochho!" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    // Simulate thinking delay (feels natural)
    await new Promise((r) => setTimeout(r, 600));

    const reply = getOfflineReply(userMsg);
    setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30 pb-24">
      <PageHeader title="Sakhi AI Copilot" onBack={() => window.history.back()} />

      {/* Offline badge */}
      <div className="mx-4 mt-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-emerald-700">100% Offline — MoHFW ANC Guidelines</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 mt-2">
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
          >
            {msg.role === "bot" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[82%] text-sm whitespace-pre-line leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-white text-foreground shadow-sm rounded-tl-sm"
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="p-3 bg-white text-foreground shadow-sm rounded-2xl rounded-tl-sm text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick suggestion chips */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {["Khatre ke nishan", "IFA tablet", "BP high", "ANC schedule"].map((chip) => (
          <button
            key={chip}
            onClick={() => { setInput(chip); }}
            className="shrink-0 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/20"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="fixed bottom-[80px] w-full max-w-md bg-white p-3 border-t">
        <div className="flex items-center gap-2 relative">
          <input
            type="text"
            className="flex-1 h-12 rounded-full bg-secondary px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Kuch bhi poochho..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 w-8 h-8 bg-primary text-white flex items-center justify-center rounded-full disabled:opacity-50"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
