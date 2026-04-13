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
      <div className={`relative flex flex-col p-8 bg-white rounded-3xl border-2 transition-all duration-500 overflow-hidden group ${
        isCurrent ? 'border-blue-600 shadow-2xl shadow-blue-500/10' : 'border-slate-100 hover:border-blue-200'
      }`}>
        {id === 'pro' && (
           <div className="absolute top-0 right-0 p-4">
              <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest shadow-xl">
                 <Crown className="w-3 h-3" /> Popular
              </span>
           </div>
        )}

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110 ${
          id === 'pro' ? 'bg-indigo-600 text-white' : id === 'basic' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          {id === 'pro' ? <Star className="w-7 h-7" /> : id === 'basic' ? <Rocket className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
        </div>

        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">{id}</h3>
        <p className="text-slate-400 text-xs font-bold mt-2 h-8 leading-relaxed mb-6">{plan.description}</p>

        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter">₦{price.toLocaleString()}</span>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/ {cycle === 'monthly' ? 'mo' : 'yr'}</span>
          </div>
          {savings > 0 && (
            <div className="mt-2 inline-flex bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-100">
               SAVE ₦{savings.toLocaleString()} ANNUALLY
            </div>
          )}
        </div>

        <div className="space-y-4 flex-1 mb-8">
           <div className="flex items-start gap-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
              <span className="text-xs font-bold text-slate-600">{plan.maxProducts >= 1000 ? 'Unlimited' : plan.maxProducts} Products</span>
           </div>
           <div className="flex items-start gap-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
              <span className="text-xs font-bold text-slate-600">{plan.maxStaff >= 1000 ? 'Unlimited' : plan.maxStaff} Staff Members</span>
           </div>
           {plan.features.auditLogs && (
             <div className="flex items-start gap-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span className="text-xs font-bold text-slate-600">Full Audit History</span>
             </div>
           )}
           {plan.features.advancedAnalytics && (
             <div className="flex items-start gap-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span className="text-xs font-bold text-slate-600">Performance BI Analytics</span>
             </div>
           )}
        </div>

        <button
          onClick={() => handleUpgrade(id)}
          disabled={isCurrent || isPending}
          className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
            isCurrent 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
              : id === 'pro' 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isCurrent ? 'Current Plan' : isPending ? 'Connecting...' : `Upgrade to ${id}`}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header Overlay */}
      <div className="relative bg-slate-900 rounded-[2.5rem] p-8 lg:p-12 overflow-hidden shadow-2xl h-[400px] flex flex-col justify-center border border-white/5">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
         
         <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 mb-6 group cursor-default">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription Status Control Center</span>
            </div>
            <h1 className="text-4xl lg:text-7xl font-black text-white tracking-tighter leading-none mb-6">
               TAKE YOUR BUSINESS <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">TO THE NEXT LEVEL.</span>
            </h1>
            <p className="text-slate-400 text-sm lg:text-lg font-medium max-w-lg leading-relaxed mb-8">
               Unlock powerful audit logs, unlimited products, and smart business intelligence for 100% stock accountability.
            </p>
         </div>

         {/* Stats in Header */}
         <div className="absolute top-1/2 -translate-y-1/2 right-0 hidden xl:flex flex-col gap-4 pr-12">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl w-64 shadow-2xl">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-400 border border-blue-500/20">
                     <Calendar className="w-6 h-6" />
                  </div>
                  {currentPlan !== 'free' && (
                     <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${isExpired ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        {isExpired ? 'Expired' : 'Active'}
                     </span>
                  )}
               </div>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Status Ends In</p>
               <div className="text-3xl font-black text-white">{currentPlan === 'free' ? '∞' : `${Math.max(0, daysRemaining)} days`}</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl w-64 shadow-2xl">
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Core Capacity</p>
               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                      <span>Products Used</span>
                      <span>{usage.products} / {limits.maxProducts >= 1000 ? '∞' : limits.maxProducts}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(100, (usage.products / limits.maxProducts) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                      <span>Staff Used</span>
                      <span>{usage.staff} / {limits.maxStaff >= 1000 ? '∞' : limits.maxStaff}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, (usage.staff / limits.maxStaff) * 100)}%` }} />
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="px-4 lg:px-0">
        {/* Cycle Toggle */}
        <div className="flex flex-col items-center mb-16">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
             <button
               onClick={() => setCycle('monthly')}
               className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                 cycle === 'monthly' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               Monthly Access
             </button>
             <button
               onClick={() => setCycle('annual')}
               className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${
                 cycle === 'annual' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               Annual Access 
               <span className="bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-full animate-bounce shadow-lg shadow-emerald-500/20">SAVE 20%</span>
             </button>
          </div>
          <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
             Secured Payments processed via Paystack
          </p>
        </div>

        {/* Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
           {(Object.keys(PLAN_LIMITS) as PlanType[]).map(id => (
             <PlanCard key={id} id={id} plan={PLAN_LIMITS[id]} />
           ))}
        </div>

        {/* Expiration Warning - If needed */}
        {currentPlan !== 'free' && isExpired && (
          <div className="mt-12 bg-rose-50 border border-rose-200 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-rose-100 animate-bounce">
             <div className="bg-rose-100 p-4 rounded-3xl text-rose-600">
                <AlertCircle className="w-10 h-10" />
             </div>
             <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-black text-slate-900 leading-none mb-1 uppercase tracking-tight">SUBSCRIPTION EXPIRED</h3>
                <p className="text-sm text-slate-500 font-medium">To keep processing sales and adding products, please renew your subscription now.</p>
             </div>
             <button 
                onClick={() => handleUpgrade(currentPlan)}
                className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
             >
                Renew Subscription
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
