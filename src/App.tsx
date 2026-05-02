import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" richColors />
      <BrowserRouter>
        <div className="mx-auto max-w-md min-h-screen bg-background relative">
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/language" element={<LanguageSelect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/voice" element={<VoiceEntry />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/sync" element={<Sync />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
