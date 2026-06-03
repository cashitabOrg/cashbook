"use client";

import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import Link from "next/link";

interface TrialBannerProps {
  storeSlug: string;
  daysRemaining: number;
}

export default function TrialBanner({ storeSlug, daysRemaining }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if dismissed state exists in sessionStorage
    const isDismissed = sessionStorage.getItem(`trial-banner-dismissed-${storeSlug}`);
    if (!isDismissed) {
      setDismissed(false);
    }
  }, [storeSlug]);

  const handleDismiss = () => {
    sessionStorage.setItem(`trial-banner-dismissed-${storeSlug}`, "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="relative w-full px-4 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest z-40 bg-blue-600 text-white shadow-lg animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-3.5 h-3.5 text-blue-100 shrink-0" />
        <span>
          You have {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left in your free trial.{" "}
          <span className="opacity-80 font-bold italic">Upgrade now to maintain service after trial.</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/${storeSlug}/admin/settings?tab=billing`}
          className="px-3 py-1 rounded-full border border-white bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 text-[9px]"
        >
          Upgrade Now
        </Link>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
