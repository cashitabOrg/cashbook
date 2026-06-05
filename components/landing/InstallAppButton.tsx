"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface InstallAppButtonProps {
  variant?: "hero" | "sidebar" | "mobile-header";
  expanded?: boolean;
}

export default function InstallAppButton({ variant = "hero", expanded = false }: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

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
      console.log("PWA was successfully installed.");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Trigger native PWA install prompt directly
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install dialog: ${outcome}`);
    setDeferredPrompt(null);
  };

  // Only render the button if the app is NOT installed AND the native browser install prompt is ready
  if (isInstalled || !deferredPrompt) {
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
        className="inline-flex items-center justify-center gap-2 bg-blue-50 text-[#0052FF] border border-blue-200 px-6 py-4 rounded-xl text-base font-bold hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm cursor-pointer border-dashed active:scale-95"
      >
        <Download className="w-5 h-5 animate-bounce" />
        Install Cashitab App
      </button>
    );
  };

  return renderButton();
}
