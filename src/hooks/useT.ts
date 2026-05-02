import { useStore } from "@/lib/store";
import { translations } from "@/lib/i18n";

export const useT = () => {
  const lang = useStore((s) => s.lang);
  return translations[lang];
};
