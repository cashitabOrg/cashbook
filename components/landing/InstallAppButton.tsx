"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface InstallAppButtonProps {
  variant?: "hero" | "sidebar" | "mobile-header";
  expanded?: boolean;
}

export default function InstallAppButton({ variant = "hero", expanded = false }: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Detect if iOS
    const detectIOS = () => {
      if (typeof window === "undefined") return;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOSDevice(isIOS);
    };
    detectIOS();

    // 2. Check if the app is already running in standalone mode (PWA window)
    const checkStandalone = () => {
      if (typeof window === "undefined") return;
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };
    checkStandalone();

    // 3. Retrieve stashed prompt from window if it was captured early
    if (typeof window !== "undefined" && (window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    // 4. Handle early window dispatch
    const handleGlobalPrompt = () => {
      if (typeof window !== "undefined" && (window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
      }
    };
    window.addEventListener("pwa-install-prompt-available", handleGlobalPrompt);

    // 5. Standard fallback listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 6. Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
      console.log("PWA was successfully installed.");
      toast.success("Cashitab installed successfully! Open the app from your home screen.", {
        duration: 5000,
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-bounce" />,
      });
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("pwa-install-prompt-available", handleGlobalPrompt);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOSDevice) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback if click is triggered but prompt isn't ready
      toast.info("Installation is not yet ready. Please wait a moment or try refreshing.");
      return;
    }
    
    // Trigger native PWA install prompt directly
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install dialog: ${outcome}`);
      if (outcome === 'accepted') {
        // App installed, sw event will trigger success toast
      }
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
    } catch (err) {
      console.error("Error triggering install prompt: ", err);
      toast.error("Failed to open install dialog. Try refreshing the page.");
    }
  };

  // Only render the button if the app is NOT installed AND (prompt is ready OR is iOS device)
  const canInstall = !isInstalled && (deferredPrompt || isIOSDevice);
  if (!canInstall) {
    return null;
  }

  const renderButton = () => {
    if (variant === "sidebar") {
      return (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Install Cashitab App"
          className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 cursor-pointer"
        >
          <Download className="w-5 h-5 shrink-0 text-blue-500" />
          <span
            className={`text-[11px] font-bold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${
              expanded ? "opacity-100 max-w-[120px]" : "opacity-0 max-w-0"
            }`}
          >
            Install App
          </span>
        </button>
      );
    }

    if (variant === "mobile-header") {
      return (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Install Cashitab App"
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors cursor-pointer"
        >
          <Download className="w-5 h-5 text-blue-500 animate-pulse" />
        </button>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        className="inline-flex items-center justify-center gap-2 bg-blue-50 text-[#0052FF] border border-blue-200 px-6 py-4 rounded-xl text-base font-bold hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm cursor-pointer border-dashed active:scale-95 animate-fade-in"
      >
        <Download className="w-5 h-5 animate-bounce" />
        Install Cashitab App
      </button>
    );
  };

  return (
    <>
      {renderButton()}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Modal Card */}
          <div className="w-full sm:max-w-md bg-white dark:bg-[#1C1C1E] border border-transparent dark:border-slate-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative transform transition-transform animate-slide-up">
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-[#0052FF] rounded-xl animate-pulse">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Install Cashitab</h3>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">PWA Offline App for iOS</p>
                </div>
              </div>
              <button 
                onClick={() => setShowIOSInstructions(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#2C2C2E] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-5">
              
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 text-[#0052FF] flex items-center justify-center font-black text-sm shrink-0">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Tap the <span className="text-blue-600 dark:text-blue-400">Share</span> button.
                  </p>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    Found at the bottom of Safari (or top right on iPad).
                  </p>
                </div>
                <div className="shrink-0 p-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg">
                  <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="9" width="14" height="11" rx="2" ry="2" />
                    <path d="M12 2v10" />
                    <path d="M9 5l3-3 3 3" />
                  </svg>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 text-[#0052FF] flex items-center justify-center font-black text-sm shrink-0">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Scroll down and select <span className="text-slate-900 dark:text-white font-extrabold">"Add to Home Screen"</span>.
                  </p>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    Requires Safari browser on iOS.
                  </p>
                </div>
                <div className="shrink-0 p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 text-[#0052FF] flex items-center justify-center font-black text-sm shrink-0">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Tap <span className="text-blue-600 dark:text-blue-400 font-extrabold">Add</span> in the top-right.
                  </p>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    The app icon will appear instantly on your home screen.
                  </p>
                </div>
                <div className="shrink-0 p-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg font-black text-xs uppercase tracking-wider">
                  Add
                </div>
              </div>

            </div>

            {/* Note info banner */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-2.5 items-center">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 tracking-tight">
                PWAs enjoy rapid load speeds, offline mode support, and secure local cash registers.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full bg-[#0052FF] text-white py-4 rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all text-base cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Style overrides for custom keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @media (min-width: 640px) {
          @keyframes slideUpCenter {
            from { transform: scale(0.9) translateY(20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }
          .animate-slide-up {
            animation: slideUpCenter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        }
      `}</style>
    </>
  );
}
