import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Splash from "./pages/Splash";
import LanguageSelect from "./pages/LanguageSelect";
import Login from "./pages/Login";
import Home from "./pages/Home";
import VoiceEntry from "./pages/VoiceEntry";
import Alerts from "./pages/Alerts";
import Sync from "./pages/Sync";
import Profile from "./pages/Profile";
import RiskAlert from "./pages/RiskAlert";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import OfflineBanner from "./components/OfflineBanner";

const queryClient = new QueryClient();

const App = () => {
  // Track online/offline with an event listener (navigator.onLine is stale on first render)
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online",  up);
      window.removeEventListener("offline", down);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner position="top-center" richColors />
        <BrowserRouter>
          {/* Offline banner slides in under the status bar */}
          <AnimatePresence>
            {!isOnline && <OfflineBanner key="offline-banner" />}
          </AnimatePresence>

          <div
            className="mx-auto max-w-md min-h-screen bg-background relative"
            style={{ paddingTop: !isOnline ? "2.25rem" : 0 }}
          >
            <Routes>
              <Route path="/"         element={<Splash />} />
              <Route path="/language" element={<LanguageSelect />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/home"     element={<Home />} />
              <Route path="/voice"    element={<VoiceEntry />} />
              <Route path="/alerts"   element={<Alerts />} />
              <Route path="/sync"     element={<Sync />} />
              <Route path="/profile"  element={<Profile />} />
              <Route path="/alert"    element={<RiskAlert />} />
              <Route path="/index"    element={<Navigate to="/" replace />} />
              <Route path="*"         element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
