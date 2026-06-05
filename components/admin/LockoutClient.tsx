"use client";

import { useState } from "react";
import { Lock, CreditCard, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PLAN_LIMITS, getPaystackPlanCode, PlanType } from "@/lib/plans";
import { openPaystack } from "@/lib/paystack";

interface LockoutClientProps {
  storeName: string;
  storeSlug: string;
  storeId: string;
  userEmail: string;
  expiredPlan: PlanType;
  signOutAction: any;
}

export default function LockoutClient({
  storeName,
  storeSlug,
  storeId,
  userEmail,
  expiredPlan,
  signOutAction,
}: LockoutClientProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    expiredPlan === 'free' ? 'starter' : expiredPlan
  );

  const handleRenew = async () => {
    setLoading(true);
    try {
      const planLimits = PLAN_LIMITS[selectedPlan];
      const amount = planLimits.priceMonthly;
      const planCode = getPaystackPlanCode(selectedPlan, 'monthly');

      await openPaystack({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: userEmail,
        ...(planCode ? { plan: planCode } : { amount: amount * 100 }),
        metadata: { storeId, planId: selectedPlan, cycle: 'monthly' },
        onSuccess: (_transaction) => {
          toast.success("Payment successful! Access unlocked.");
          setTimeout(() => window.location.reload(), 1500);
        },
        onCancel: () => {
          toast.info("Payment closed.");
          setLoading(false);
        },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to initialize payment.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950/60 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative z-10 text-center">
        
        {/* Lock Icon */}
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 animate-pulse">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white mb-2 leading-none">
          Access Locked
        </h2>
        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
          Your subscription has expired. Renew to continue accessing Cashitab.
        </p>

        {/* Plan selector if they were on free / trial expired */}
        {expiredPlan === 'free' && (
          <div className="mb-6 text-left">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
              Select Subscription Plan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['starter', 'growth', 'business'] as PlanType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlan(p)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider ${
                    selectedPlan === p
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center font-bold">
              {selectedPlan === 'starter' && '₦7,500 / month'}
              {selectedPlan === 'growth' && '₦15,000 / month'}
              {selectedPlan === 'business' && '₦35,000 / month'}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleRenew}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" /> Renew Now
              </>
            )}
          </button>

          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 border border-slate-800"
            >
              <LogOut className="w-4 h-4" /> Logout from {storeName}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
