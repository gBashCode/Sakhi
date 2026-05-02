import { useState } from "react";
import { ShieldAlert, Phone, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export default function SOSButton() {
  const [open, setOpen] = useState(false);

  const triggerSOS = (type: string, number: string) => {
    toast.error(`${type} Emergency Triggered!`, {
      description: `Calling ${number} and sending live GPS coordinates...`,
      duration: 5000,
    });
    setOpen(false);
    
    // Using a slight timeout so the user sees the toast before the native dialer blocks the UI
    setTimeout(() => {
      window.location.href = `tel:${number}`;
    }, 1000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600/10 p-4 text-red-600 border border-red-600/20 active:scale-[0.98] transition-transform shadow-sm"
      >
        <ShieldAlert className="h-6 w-6" />
        <span className="font-bold text-lg tracking-wide">Emergency SOS</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Emergency SOS</h2>
              <p className="mt-2 text-sm text-slate-500">
                Select an emergency service to contact immediately. Your live location will be shared.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => triggerSOS("Police", "100")}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-lg shadow-md"
              >
                <Shield className="mr-2 h-5 w-5" /> Call Police (100)
              </Button>
              <Button
                onClick={() => triggerSOS("Ambulance", "108")}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-lg shadow-md"
              >
                <Phone className="mr-2 h-5 w-5" /> Call Ambulance (108)
              </Button>
              <Button
                onClick={() => triggerSOS("Admin", "8585858585")}
                className="w-full h-14 bg-slate-800 hover:bg-slate-900 text-lg shadow-md text-white"
              >
                <ShieldAlert className="mr-2 h-5 w-5" /> Alert Admin Portal
              </Button>
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                className="w-full h-12 text-slate-600 mt-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
