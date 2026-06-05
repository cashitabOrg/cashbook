"use client";

import { useState } from "react";
import { X, Sparkles, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PLAN_LIMITS, getPaystackPlanCode, PlanType } from "@/lib/plans";
import { openPaystack } from "@/lib/paystack";

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  nextPlanName: PlanType;
  nextPlanPrice: string;
  storeSlug: string;
  storeId: string;
  userEmail: string;
}

export default function UpgradePromptModal({
  isOpen,
  onClose,
  title,
  description,
  nextPlanName,
  nextPlanPrice,
  storeSlug,
  storeId,
  userEmail,
}: UpgradePromptModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const planLimits = PLAN_LIMITS[nextPlanName];
      const amount = planLimits.priceMonthly;
      const planCode = getPaystackPlanCode(nextPlanName, 'monthly');

      await openPaystack({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: userEmail,
        amount: amount * 100,
        plan: planCode || undefined,
        metadata: { storeId, planId: nextPlanName, cycle: 'monthly' },
        onSuccess: (_transaction) => {
          toast.success(`Plan successfully upgraded to ${nextPlanName.toUpperCase()}!`);
          onClose();
          setTimeout(() => window.location.reload(), 1500);
        },
        onCancel: () => {
          toast.info("Upgrade cancelled.");
          setLoading(false);
        },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to initialize payment.");
      setLoading(false);
    }
  };

  const getUnlocks = () => {
    if (nextPlanName === 'growth') {
      return [
        "Up to 5 staff accounts",
        "180 days transaction history",
        "Export professional sales reports",
        "Priority dedicated support"
      ];
    }
    if (nextPlanName === 'business') {
      return [
        "Up to 3 store locations",
        "Up to 2 admin accounts",
        "Unlimited staff members",
        "Unlimited transaction history",
        "Multi-store business dashboard"
      ];
    }
    return ["Expanded system capacity", "Advanced POS and Inventory features"];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121214] border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Glow behind modal icon */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Premium Badge & Header */}
        <div className="flex flex-col items-center text-center mt-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-[#001A4D] dark:text-white leading-none">
            {title}
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest mt-2">
            Capacity Limit Reached
          </p>
        </div>

        {/* Description */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/20 text-center mb-6">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {description}
          </p>
        </div>

        {/* What gets unlocked */}
        <div className="mb-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#001A4D] dark:text-white mb-4">
            Unlocks on {nextPlanName.toUpperCase()}:
          </h4>
          <ul className="space-y-3">
            {getUnlocks().map((unlock, index) => (
              <li key={index} className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{unlock}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Call To Action */}
        <div className="space-y-4">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#0052FF] hover:bg-blue-700 text-white font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <>
                Upgrade to {nextPlanName.toUpperCase()} — {nextPlanPrice}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-wider py-1.5"
          >
            Cancel and Go Back
          </button>
        </div>

      </div>
    </div>
  );
}
