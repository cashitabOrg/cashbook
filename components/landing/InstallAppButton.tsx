"use client";

import { useEffect, useState } from "react";
import { Download, X, Monitor, Smartphone, HelpCircle } from "lucide-react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 1. Check if the app is already running in standalone mode (PWA window)
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowModal(false);
      console.log("PWA was successfully installed.");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // If native PWA trigger is ready, use it directly!
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install dialog: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      // If native prompt is not fired yet, show our elegant instruction guide modal!
      setShowModal(true);
    }
  };

  // Hide the button completely if the app is already successfully installed/running standalone
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="inline-flex items-center justify-center gap-2 bg-blue-50 text-[#0052FF] border border-blue-200 px-6 py-4 rounded-xl text-base font-bold hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm cursor-pointer border-dashed active:scale-95"
      >
        <Download className="w-5 h-5 animate-bounce" />
        Install Cashitab App
      </button>

      {/* Modern Platform Instruction Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-50 p-2 rounded-xl text-[#0052FF]">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#001A4D]">How to Install Cashitab</h3>
                  <p className="text-xs text-slate-500 font-medium">Follow these quick steps to get the app on your screen</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Tabs/Panels */}
            <div className="p-6 space-y-5 max-h-[70dvh] overflow-y-auto">
              
              {/* Desktop Instruction */}
              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-slate-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">On Windows PC & Mac (Chrome / Edge)</h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 leading-relaxed font-medium">
                    <li>Look at your browser's address bar at the top right.</li>
                    <li>Click the **Install Icon** (looks like three squares and a plus, or a monitor with a down arrow).</li>
                    <li>Confirm **"Install"** to instantly add the app to your desktop.</li>
                  </ul>
                </div>
              </div>

              {/* iOS / Safari Instruction */}
              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-slate-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">On iPhone & iPad (Safari)</h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 leading-relaxed font-medium">
                    <li>Tap the **Share button** at the bottom of Safari (square with an arrow pointing up).</li>
                    <li>Scroll down the menu list and tap **"Add to Home Screen"**.</li>
                    <li>Tap **"Add"** in the top right to install Cashitab.</li>
                  </ul>
                </div>
              </div>

              {/* Android Instruction */}
              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-slate-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">On Android (Chrome / Firefox)</h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 leading-relaxed font-medium">
                    <li>Tap the **three vertical dots** in the top right corner.</li>
                    <li>Select **"Install App"** or **"Add to Home Screen"**.</li>
                    <li>Confirm the dialog to place the icon on your screen.</li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="bg-[#0052FF] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
