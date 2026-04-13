"use client";

import { AlertCircle, Zap, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BillingBannerProps {
  storeSlug: string;
  plan: string;
  daysRemaining: number | null;
  isExempt?: boolean;
}

export default function BillingBanner({ storeSlug, plan, daysRemaining, isExempt }: BillingBannerProps) {
  const pathname = usePathname();
  
  // Don't show on the billing page itself to avoid clutter
  if (pathname.includes("/admin/billing")) return null;

  if (isExempt) {
    return (
      <div className="relative w-full px-4 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest z-50 shadow-lg bg-indigo-600 text-white">
        <div className="flex items-center gap-3">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          <span>BETA / TESTING MODE — <span className="opacity-80 font-bold italic">Unlimited features enabled for testing. Billing will commence soon.</span></span>
        </div>
        <div className="px-2 py-0.5 rounded bg-white/20 border border-white/20">Active</div>
      </div>
    );
  }

  const isExpired = daysRemaining !== null && daysRemaining < 0;
  const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;
  const isFree = plan === "free";

  if (!isExpired && !isExpiringSoon && !isFree) return null;

  return (
    <div className={`relative w-full px-4 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest z-50 shadow-lg ${
      isExpired 
        ? "bg-rose-600 text-white animate-pulse" 
        : isExpiringSoon 
          ? "bg-amber-500 text-white" 
          : "bg-slate-900/5 backdrop-blur-md text-slate-500 border-b border-slate-200"
    }`}>
      <div className="flex items-center gap-3">
        {isExpired ? (
          <ShieldAlert className="w-3.5 h-3.5" />
        ) : isExpiringSoon ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : (
          <Zap className="w-3.5 h-3.5 text-blue-500" />
        )}
        
        <span>
          {isFree ? (
             <>Kiosk Mode (Free Plan) — <span className="opacity-70">Upgrade to Basic for ₦15k/mo to unlock full audit logs.</span></>
          ) : isExpired ? (
             <>Subscription Expired — <span className="opacity-90">Sales and Product creation are currently locked.</span></>
          ) : (
             <>Subscription ends in {daysRemaining} days — <span className="opacity-90">Renew now to avoid service interruption.</span></>
          )}
        </span>
      </div>

      <Link 
        href={`/${storeSlug}/admin/billing`}
        className={`px-3 py-1 rounded-full border transition-all active:scale-95 ${
          isExpired || isExpiringSoon 
            ? "border-white bg-white/10 hover:bg-white/20 text-white" 
            : "border-blue-600/50 bg-blue-50 hover:bg-blue-100 text-blue-600"
        }`}
      >
        {isFree ? "View Plans" : "Renew / Upgrade"}
      </Link>
    </div>
  );
}
