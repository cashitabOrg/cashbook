"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  ShieldCheck, 
  Rocket, 
  Star, 
  AlertCircle,
  Crown,
  Loader2,
  Phone,
  MessageSquare
} from "lucide-react";
import { PLAN_LIMITS, PlanType, getPlanLimits, getPaystackPlanCode } from "@/lib/plans";
import { openPaystack } from "@/lib/paystack";
import { toast } from "sonner";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

interface BillingDashboardProps {
  storeSlug: string;
  currentPlan: PlanType;
  subscription: any;
  usage: {
    products: number;
    staff: number;
  };
  storeId: string;
  userEmail: string;
  subStatus: any;
}

export default function BillingDashboard({
  storeSlug,
  currentPlan,
  subscription,
  usage,
  storeId,
  userEmail,
  subStatus
}: BillingDashboardProps) {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  // Normalize legacy plans
  let normalizedPlan = currentPlan.toLowerCase() as PlanType;
  if ((normalizedPlan as string) === 'basic') normalizedPlan = 'growth';
  if ((normalizedPlan as string) === 'pro') normalizedPlan = 'business';

  const limits = getPlanLimits(normalizedPlan);
  const expiryDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpired = daysRemaining < 0;

  // Defensive fallback for subStatus to prevent runtime crashes
  const sub = {
    plan: subStatus?.plan || currentPlan || 'free',
    isTrial: !!subStatus?.isTrial,
    trialDaysLeft: subStatus?.trialDaysLeft || 0,
    isExpired: subStatus?.isExpired ?? isExpired,
    expiryDate: subStatus?.expiryDate || expiryDate,
    isExempt: !!subStatus?.isExempt,
    daysRemaining: subStatus?.daysRemaining ?? daysRemaining
  };

  // Plan hierarchy for downgrade detection
  const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, growth: 2, business: 3 };

  const handleUpgrade = async (planId: PlanType) => {
    if (planId === normalizedPlan && !isExpired) {
      toast.info("You are already on this plan!");
      return;
    }

    // Warn before downgrading an active subscription
    if (!isExpired && PLAN_RANK[planId] < PLAN_RANK[normalizedPlan]) {
      const confirmed = window.confirm(
        `You are about to downgrade from ${normalizedPlan.toUpperCase()} to ${planId.toUpperCase()}.\n\n` +
        `This will reduce your staff and history limits immediately after payment is processed. Are you sure you want to continue?`
      );
      if (!confirmed) return;
    }

    setCheckoutPlan(planId);
    try {
      const planLimits = PLAN_LIMITS[planId];
      const amount = cycle === 'monthly' ? planLimits.priceMonthly : planLimits.priceAnnual;
      const planCode = getPaystackPlanCode(planId, cycle);

      await openPaystack({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: userEmail,
        ...(planCode ? { plan: planCode } : { amount: amount * 100 }),
        metadata: { storeId, planId, cycle, userId: userEmail },
        onSuccess: (_transaction) => {
          toast.success("Payment successful! Activating subscription...");
          setTimeout(() => window.location.reload(), 1500);
        },
        onCancel: () => {
          toast.info("Checkout closed.");
          setCheckoutPlan(null);
        },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to initialize payment.");
      setCheckoutPlan(null);
    }
  };

  const PlanCard = ({ id, plan }: { id: PlanType; plan: any }) => {
    const isCurrent = id === normalizedPlan;
    const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
    const savings = cycle === 'annual' ? (plan.priceMonthly * 12) - plan.priceAnnual : 0;

    return (
      <div className={`relative flex flex-col p-6 lg:p-8 bg-white dark:bg-[#1C1C1E] rounded-3xl border transition-all duration-300 overflow-hidden ${
        isCurrent && !isExpired ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-gray-200 dark:border-[#2C2C2E] shadow-sm hover:border-gray-300 dark:hover:border-[#3A3A3C]'
      }`}>
        {id === 'growth' && (
           <div className="absolute top-0 right-0 p-4">
              <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                 <Crown className="w-3 h-3" /> Popular
              </span>
           </div>
        )}

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm border ${
          id === 'business' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20' 
          : id === 'growth' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' 
          : 'bg-gray-50 dark:bg-[#252528] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#3A3A3C]'
        }`}>
          {id === 'business' ? <Star className="w-5 h-5" /> : id === 'growth' ? <Rocket className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize mb-2">{id} Plan</h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 h-8 leading-relaxed mb-6">{plan.description}</p>

        <div className="mb-8">
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(price)}</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest whitespace-nowrap">/ {cycle === 'monthly' ? 'mo' : 'yr'}</span>
          </div>
          {savings > 0 && (
            <div className="mt-2 inline-flex bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
               SAVE {formatCurrency(savings)} ANNUALLY
            </div>
          )}
        </div>

        <div className="space-y-4 flex-1 mb-8">
           <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white mt-0.5 shrink-0" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{plan.maxStores} Store Location</span>
           </div>
           <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white mt-0.5 shrink-0" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{plan.maxStaff >= 1000 ? 'Unlimited' : plan.maxStaff} Staff Members</span>
           </div>
           <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white mt-0.5 shrink-0" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{plan.maxAdmins} Admin Accounts</span>
           </div>
           <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white mt-0.5 shrink-0" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{plan.transactionDays >= 1000 ? 'Unlimited' : plan.transactionDays} days history</span>
           </div>
           {plan.features.exportReports && (
             <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white mt-0.5 shrink-0" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Export reports</span>
             </div>
           )}
           {plan.features.multiStoreDashboard && (
             <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white mt-0.5 shrink-0" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Multi store dashboard</span>
             </div>
           )}
        </div>

        <button
          onClick={() => handleUpgrade(id)}
          disabled={checkoutPlan !== null}
          className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 ${
            isCurrent && !isExpired
              ? 'bg-gray-100 dark:bg-[#252528] text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none border border-gray-200 dark:border-[#3A3A3C]' 
              : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
          }`}
        >
          {checkoutPlan === id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isCurrent && !isExpired ? (
            'Current Plan'
          ) : (
            `Subscribe ${id}`
          )}
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
               <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Staff Members</span>
               <span className="text-sm font-bold text-gray-900 dark:text-white">
                 {usage.staff} / {limits.maxStaff >= 1000 ? '∞' : limits.maxStaff}
               </span>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-[#3A3A3C]" />
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Plan Status</span>
               <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    sub.isExpired ? 'bg-rose-500' : 'bg-emerald-500'
                  }`} />
                  <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                    {sub.isTrial ? 'Free Trial' : sub.isExpired ? 'Expired' : 'Active'}
                  </span>
               </div>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-[#3A3A3C]" />
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                 {sub.isTrial ? 'Trial Days Left' : 'Renewal Date'}
               </span>
               <span className="text-sm font-bold text-gray-900 dark:text-white">
                 {sub.isExempt 
                   ? 'Unlimited' 
                   : sub.isTrial 
                     ? `${sub.trialDaysLeft} days` 
                     : sub.expiryDate 
                       ? new Date(sub.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                       : 'None'
                 }
               </span>
            </div>
         </div>
      </div>

      {/* Cycle Toggle */}
      <div className="flex flex-col items-center mb-10">
        <div className="bg-gray-100 dark:bg-[#252528] p-1.5 rounded-2xl flex items-center gap-1 border border-gray-200 dark:border-[#3A3A3C] shadow-inner">
           <button
             onClick={() => setCycle('monthly')}
             className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all ${
               cycle === 'monthly' ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
             }`}
           >
             Monthly billing
           </button>
           <button
             onClick={() => setCycle('annual')}
             className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
               cycle === 'annual' ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
             }`}
           >
             Annual billing
             <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">Save 2 months</span>
           </button>
        </div>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {(['starter', 'growth', 'business'] as PlanType[]).map(id => (
           <PlanCard key={id} id={id} plan={PLAN_LIMITS[id]} />
         ))}

         {/* Enterprise Card */}
         <div className="relative flex flex-col p-6 lg:p-8 bg-gradient-to-br from-[#0B0F19] to-[#161D30] border border-slate-800 text-white rounded-3xl transition-all duration-300">
            <h3 className="text-xl font-bold mb-2">Enterprise Plan</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed mb-6">Need more than 3 stores or custom solution?</p>
            <div className="space-y-4 flex-1 mb-8">
              <div className="flex items-start gap-3">
                 <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                 <span className="text-xs font-medium text-slate-300">Unlimited store locations</span>
              </div>
              <div className="flex items-start gap-3">
                 <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                 <span className="text-xs font-medium text-slate-300">Tailored plan for your network</span>
              </div>
            </div>
            <div className="space-y-3">
              <a
                href={process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "https://wa.me/"}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Phone className="w-3.5 h-3.5" /> WhatsApp Us
              </a>
              <a
                href="mailto:cashitab@gmail.com"
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-750"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Contact Us
              </a>
            </div>
         </div>
      </div>

      {/* Expiration Warning */}
      {normalizedPlan !== 'free' && isExpired && (
        <div className="mt-12 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-sm">
           <div className="bg-rose-100 dark:bg-rose-500/20 p-3 rounded-xl text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-8 h-8" />
           </div>
           <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none mb-1">Subscription Expired</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">To keep processing sales and adding staff, please renew your subscription now.</p>
           </div>
           <button 
              onClick={() => handleUpgrade(normalizedPlan)}
              disabled={checkoutPlan !== null}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
           >
              {checkoutPlan === normalizedPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : "Renew Subscription"}
           </button>
        </div>
      )}
    </div>
  );
}
