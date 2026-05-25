"use client";

import { useState, useTransition } from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Rocket, 
  Star, 
  Calendar, 
  Users, 
  Package,
  AlertCircle,
  Crown
} from "lucide-react";
import { PLAN_LIMITS, PlanType, getPlanLimits } from "@/lib/plans";
import { initializePaystackCheckout } from "@/app/actions/billing";
import { toast } from "sonner";

interface BillingDashboardProps {
  storeSlug: string;
  currentPlan: PlanType;
  subscription: any;
  usage: {
    products: number;
    staff: number;
  };
}

export default function BillingDashboard({
  storeSlug,
  currentPlan,
  subscription,
  usage
}: BillingDashboardProps) {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isPending, startTransition] = useTransition();

  const limits = getPlanLimits(currentPlan);
  const expiryDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpired = daysRemaining < 0;

  const handleUpgrade = async (planId: PlanType) => {
    if (planId === currentPlan) {
      toast.info("You are already on this plan!");
      return;
    }

    startTransition(async () => {
      const res = await initializePaystackCheckout(storeSlug, planId, cycle);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    });
  };

  const PlanCard = ({ id, plan }: { id: PlanType, plan: any }) => {
    const isCurrent = id === currentPlan;
    const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
    const savings = cycle === 'annual' ? (plan.priceMonthly * 12) - plan.priceAnnual : 0;

    return (
      <div className={`relative flex flex-col p-8 bg-white dark:bg-[#1C1C1E] rounded-3xl border transition-all duration-300 overflow-hidden ${
        isCurrent ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-gray-200 dark:border-[#2C2C2E] shadow-sm hover:border-gray-300 dark:hover:border-[#3A3A3C]'
      }`}>
        {id === 'pro' && (
           <div className="absolute top-0 right-0 p-4">
              <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                 <Crown className="w-3 h-3" /> Popular
              </span>
           </div>
        )}

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm border ${
          id === 'pro' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20' 
          : id === 'basic' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' 
          : 'bg-gray-50 dark:bg-[#252528] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#3A3A3C]'
        }`}>
          {id === 'pro' ? <Star className="w-5 h-5" /> : id === 'basic' ? <Rocket className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize mb-2">{id} Plan</h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 h-8 leading-relaxed mb-6">{plan.description}</p>

        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">₦{price.toLocaleString()}</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">/ {cycle === 'monthly' ? 'mo' : 'yr'}</span>
          </div>
          {savings > 0 && (
            <div className="mt-2 inline-flex bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
               SAVE ₦{savings.toLocaleString()} ANNUALLY
            </div>
          )}
        </div>

        <div className="space-y-4 flex-1 mb-8">
           <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white mt-0.5 shrink-0" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{plan.maxProducts >= 1000 ? 'Unlimited' : plan.maxProducts} Products</span>
           </div>
           <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white mt-0.5 shrink-0" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{plan.maxStaff >= 1000 ? 'Unlimited' : plan.maxStaff} Staff Members</span>
           </div>
           {plan.features.auditLogs && (
             <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white mt-0.5 shrink-0" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Full Audit History</span>
             </div>
           )}
           {plan.features.advancedAnalytics && (
             <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white mt-0.5 shrink-0" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Performance BI Analytics</span>
             </div>
           )}
        </div>

        <button
          onClick={() => handleUpgrade(id)}
          disabled={isCurrent || isPending}
          className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
            isCurrent 
              ? 'bg-gray-100 dark:bg-[#252528] text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none border border-gray-200 dark:border-[#3A3A3C]' 
              : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
          }`}
        >
          {isCurrent ? 'Current Plan' : isPending ? 'Connecting...' : `Upgrade to ${id}`}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-32 max-w-6xl mx-auto px-4 lg:px-0">
      
      {/* Minimal Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
         <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Billing & Plans</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage your workspace subscription and view account limits.</p>
         </div>
         
         {/* Mini usage stats */}
         <div className="flex items-center gap-6 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] px-6 py-4 rounded-2xl shadow-sm">
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Products</span>
               <span className="text-sm font-bold text-gray-900 dark:text-white">{usage.products} / {limits.maxProducts >= 1000 ? '∞' : limits.maxProducts}</span>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-[#3A3A3C]" />
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Staff</span>
               <span className="text-sm font-bold text-gray-900 dark:text-white">{usage.staff} / {limits.maxStaff >= 1000 ? '∞' : limits.maxStaff}</span>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-[#3A3A3C]" />
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Status</span>
               <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${currentPlan === 'free' ? 'bg-gray-400' : isExpired ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                     {currentPlan === 'free' ? 'Free' : isExpired ? 'Expired' : 'Active'}
                  </span>
               </div>
            </div>
         </div>
      </div>

      {/* Cycle Toggle */}
      <div className="flex flex-col items-center mb-10">
        <div className="bg-gray-100 dark:bg-[#252528] p-1 rounded-xl flex items-center gap-1 border border-gray-200 dark:border-[#3A3A3C] shadow-inner">
           <button
             onClick={() => setCycle('monthly')}
             className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${
               cycle === 'monthly' ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
             }`}
           >
             Monthly billing
           </button>
           <button
             onClick={() => setCycle('annual')}
             className={`px-6 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
               cycle === 'annual' ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
             }`}
           >
             Annual billing
             <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">Save 20%</span>
           </button>
        </div>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {(Object.keys(PLAN_LIMITS) as PlanType[]).map(id => (
           <PlanCard key={id} id={id} plan={PLAN_LIMITS[id]} />
         ))}
      </div>

      {/* Expiration Warning - If needed */}
      {currentPlan !== 'free' && isExpired && (
        <div className="mt-12 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-sm">
           <div className="bg-rose-100 dark:bg-rose-500/20 p-3 rounded-xl text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-8 h-8" />
           </div>
           <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none mb-1">Subscription Expired</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">To keep processing sales and adding products, please renew your subscription now.</p>
           </div>
           <button 
              onClick={() => handleUpgrade(currentPlan)}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
           >
              Renew Subscription
           </button>
        </div>
      )}
    </div>
  );
}
