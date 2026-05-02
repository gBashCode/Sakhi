import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PageHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 p-4 bg-white border-b sticky top-0 z-10">
      <button 
        onClick={onBack || (() => navigate(-1))}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/50 text-foreground"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  );
}
