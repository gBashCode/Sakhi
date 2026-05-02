import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Send, User } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { askCopilot } from "@/lib/api";

export default function Copilot() {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Namaste! I am Sakhi AI Copilot. How can I assist you with your patients today?" },
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

    const reply = await askCopilot(userMsg);
    setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30 pb-24">
      <PageHeader title="Sakhi AI Copilot" onBack={() => window.history.back()} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
          >
            {msg.role === "bot" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[80%] text-sm ${
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
            <div className="p-3 bg-white text-foreground shadow-sm rounded-2xl rounded-tl-sm text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-75" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-150" />
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      <div className="fixed bottom-[80px] w-full max-w-md bg-white p-3 border-t">
        <div className="flex items-center gap-2 relative">
          <input
            type="text"
            className="flex-1 h-12 rounded-full bg-secondary px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Ask medical guidelines..."
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
