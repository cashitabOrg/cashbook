"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronRight, MessageSquare, Phone, ArrowLeft, Loader2, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { PLAN_LIMITS, getPaystackPlanCode, PlanType } from "@/lib/plans";
import { formatCurrency } from "@/lib/format";

// Dynamic script loader for Paystack Inline JS
const loadPaystack = (): Promise<any> => {
  return new Promise((resolve) => {
    if ((window as any).PaystackPop) {
      resolve((window as any).PaystackPop);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve((window as any).PaystackPop);
    document.body.appendChild(script);
  });
};

export default function PublicPricingPage() {
  const router = useRouter();
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data: prof } = await supabase
            .from("users")
            .select("*, stores(slug)")
            .eq("id", user.id)
            .single();
          setProfile(prof);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUser(false);
      }
    }
    checkUser();
  }, []);

  const handleSubscribe = async (planId: PlanType) => {
    if (loadingUser) return;

    if (!user) {
      toast.info("Please create an account or sign in to subscribe.");
      router.push(`/register?redirect=/pricing`);
      return;
    }

    if (profile && !profile.store_id) {
      toast.info("Please set up your store first.");
      router.push("/onboarding");
      return;
    }

    setCheckoutPlan(planId);
    try {
      const planLimits = PLAN_LIMITS[planId];
      const amount = cycle === 'monthly' ? planLimits.priceMonthly : planLimits.priceAnnual;
      const planCode = getPaystackPlanCode(planId, cycle);

      const storeSlug = profile.stores?.slug || 'admin';
      const storeId = profile.store_id;

      // Load Paystack Pop
      const PaystackPop = await loadPaystack();
      const handler = PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: user.email || '',
        ...(planCode ? { plan: planCode } : { amount: amount * 100 }),
        metadata: {
          storeId,
          planId,
          cycle,
          userId: user.id,
        },
        callback: function (response: any) {
          toast.success("Payment successful! Activating your subscription...");
          
          // Poll database or wait a few seconds and redirect to dashboard
          setTimeout(() => {
            window.location.href = `/${storeSlug}/admin/dashboard`;
          }, 2000);
        },
        onClose: function () {
          toast.info("Payment window closed.");
          setCheckoutPlan(null);
        },
      });
      handler.openIframe();
    } catch (err: any) {
      toast.error(err?.message || "Failed to initialize payment.");
      setCheckoutPlan(null);
    }
  };

  const getPriceText = (planId: PlanType) => {
    const limits = PLAN_LIMITS[planId];
    const amount = cycle === 'monthly' ? limits.priceMonthly : limits.priceAnnual;
    return formatCurrency(amount);
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-gray-100 font-sans bg-[#F4F9FD] dark:bg-[#0A0A0C] relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-300/10 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-300/10 dark:bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Navbar */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/Logo_cashitab.png" alt="Logo" className="w-9 h-9 object-contain" />
          <span className="text-lg font-black tracking-tight text-[#0052FF] uppercase">CASHITAB</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href={profile?.stores?.slug ? `/${profile.stores.slug}/admin/dashboard` : "/onboarding"}
              className="text-xs font-bold uppercase tracking-wider bg-[#0052FF] text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-[#0052FF] transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-bold uppercase tracking-wider bg-[#E8F1FF] text-[#0052FF] px-5 py-2.5 rounded-full hover:bg-blue-100 transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-[#001A4D] dark:text-white tracking-tight mb-6">
            Simple, Transparent Pricing.
          </h1>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
            Power your retail business with advanced stock tracking, offline POS mode, and remote reports. Choose a plan that fits your stage.
          </p>

          {/* Toggle Switch */}
          <div className="inline-flex bg-slate-200/60 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-300/20 shadow-inner">
            <button
              onClick={() => setCycle('monthly')}
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider ${
                cycle === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-[#001A4D] dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider flex items-center gap-2 ${
                cycle === 'annual'
                  ? 'bg-white dark:bg-slate-700 text-[#001A4D] dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Annual Billing
              <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase">
                Save 2 Months
              </span>
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-4">
            ✨ Every plan includes a <span className="font-bold text-emerald-600">14-day free trial</span> — no credit card required.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Card 1: Starter */}
          <div className="bg-white dark:bg-[#121214] border border-slate-100 dark:border-slate-800/50 p-8 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col justify-between hover:border-[#0052FF]/30 hover:-translate-y-1 transition-all duration-300">
            <div>
              <h3 className="text-[#001A4D] dark:text-white text-lg font-black uppercase tracking-wider mb-2">Starter</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium min-h-[32px] leading-relaxed mb-6">
                Perfect for single-store setups starting their journey.
              </p>
              
              <div className="mb-8">
                <span className="text-4xl font-black text-[#001A4D] dark:text-white tracking-tight">{getPriceText('starter')}</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                  / {cycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>1 store location</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>2 staff accounts</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>1 admin account</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>POS access & Stock tracking</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Offline mode & Variance tracking</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>90 days transaction history</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Remote monitoring</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('starter')}
              disabled={checkoutPlan !== null}
              className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-[#0052FF] text-[#001A4D] hover:text-white font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
            >
              {checkoutPlan === 'starter' ? <Loader2 className="w-4 h-4 animate-spin" /> : user ? 'Subscribe Starter' : 'Start Free Trial'}
            </button>
          </div>

          {/* Card 2: Growth (Featured) */}
          <div className="bg-white dark:bg-[#121214] border-2 border-[#0052FF] p-8 rounded-[2rem] shadow-2xl shadow-blue-500/10 flex flex-col justify-between relative hover:-translate-y-1 transition-all duration-300 z-10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FFF4D4] text-[#855B00] text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-[#FFE18A]">
              Most Popular
            </span>
            <div>
              <h3 className="text-[#001A4D] dark:text-white text-lg font-black uppercase tracking-wider mb-2">Growth</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium min-h-[32px] leading-relaxed mb-6">
                The standard for growing retail businesses expanding their footprint.
              </p>
              
              <div className="mb-8">
                <span className="text-4xl font-black text-[#001A4D] dark:text-white tracking-tight">{getPriceText('growth')}</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                  / {cycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-[#0052FF] shrink-0 mt-0.5" />
                  <span className="font-extrabold">Everything in Starter</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>5 staff accounts</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>180 days transaction history</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Export reports</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('growth')}
              disabled={checkoutPlan !== null}
              className="w-full py-4 rounded-2xl bg-[#0052FF] hover:bg-blue-700 text-white font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {checkoutPlan === 'growth' ? <Loader2 className="w-4 h-4 animate-spin" /> : user ? 'Subscribe Growth' : 'Start Free Trial'}
            </button>
          </div>

          {/* Card 3: Business */}
          <div className="bg-white dark:bg-[#121214] border border-slate-100 dark:border-slate-800/50 p-8 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col justify-between hover:border-[#0052FF]/30 hover:-translate-y-1 transition-all duration-300">
            <div>
              <h3 className="text-[#001A4D] dark:text-white text-lg font-black uppercase tracking-wider mb-2">Business</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium min-h-[32px] leading-relaxed mb-6">
                Bespoke features and multi-store control for advanced merchants.
              </p>
              
              <div className="mb-8">
                <span className="text-4xl font-black text-[#001A4D] dark:text-white tracking-tight">{getPriceText('business')}</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                  / {cycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-[#0052FF] shrink-0 mt-0.5" />
                  <span className="font-extrabold">Everything in Growth</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>3 store locations</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>2 admin accounts</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Unlimited staff</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Unlimited transaction history</span>
                </li>
                <li className="flex items-start gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Multi store dashboard</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('business')}
              disabled={checkoutPlan !== null}
              className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-[#0052FF] text-[#001A4D] hover:text-white font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
            >
              {checkoutPlan === 'business' ? <Loader2 className="w-4 h-4 animate-spin" /> : user ? 'Subscribe Business' : 'Start Free Trial'}
            </button>
          </div>

          {/* Card 4: Enterprise */}
          <div className="bg-gradient-to-br from-[#0B0F19] to-[#161D30] border border-slate-800 text-white p-8 rounded-[2rem] flex flex-col justify-between hover:border-[#0052FF]/50 hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-white text-lg font-black uppercase tracking-wider mb-2">Enterprise</h3>
              <p className="text-slate-400 text-xs font-medium min-h-[32px] leading-relaxed mb-8">
                Need more than 3 stores or a custom solution? Contact us for a tailored plan.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Unlimited store locations</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Bespoke limits & Custom integrations</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Dedicated accounts manager</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "https://wa.me/2349061814608"}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15"
              >
                <Phone className="w-4 h-4" /> WhatsApp Us
              </a>
              <a
                href="mailto:cashitab@gmail.com"
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <MessageSquare className="w-4 h-4" /> Contact Us
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
