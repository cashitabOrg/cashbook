'use client';

import { useState } from 'react';
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  desc: string;
  features: string[];
  cta: string;
  ctaHref: string;
  featured?: boolean;
  tag?: string;
}

const plans: Plan[] = [
  {
    name: 'Starter',
    monthlyPrice: 7500,
    annualPrice: 75000,
    desc: 'Perfect for single-store setups just getting started with smart retail management.',
    features: [
      '1 store location',
      '1 admin account',
      '2 staff accounts',
      'Full POS access',
      'Stock tracking & inventory',
      'Offline mode',
      'Variance & shrinkage tracking',
      '90-day transaction history',
      'Remote monitoring',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/register',
  },
  {
    name: 'Growth',
    monthlyPrice: 15000,
    annualPrice: 150000,
    desc: 'The go-to plan for retail businesses scaling their operations and team.',
    tag: 'Most Popular',
    featured: true,
    features: [
      '1 store location',
      '1 admin account',
      '5 staff accounts',
      'Full POS access',
      'Stock tracking & inventory',
      'Offline mode',
      'Variance & shrinkage tracking',
      '180-day transaction history',
      'Remote monitoring',
      'Export reports (CSV & PDF)',
      'Advanced sales analytics',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/register',
  },
  {
    name: 'Business',
    monthlyPrice: 35000,
    annualPrice: 350000,
    desc: 'Multi-store control, unlimited staff, and deep insights for serious merchants.',
    features: [
      '3 store locations',
      '2 admin accounts',
      'Unlimited staff accounts',
      'Full POS access',
      'Stock tracking & inventory',
      'Offline mode',
      'Variance & shrinkage tracking',
      'Unlimited transaction history',
      'Remote monitoring',
      'Export reports (CSV & PDF)',
      'Advanced sales analytics',
      'Multi-store dashboard',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/register',
  },
];

function formatPrice(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

function PricingCard({ plan, cycle }: { plan: Plan; cycle: 'monthly' | 'annual' }) {
  const price = cycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const periodLabel = cycle === 'monthly' ? '/mo' : '/yr';
  const savings = plan.monthlyPrice * 12 - plan.annualPrice;

  return (
    <div
      className={`relative flex flex-col h-full rounded-[2rem] transition-all duration-300 p-8 sm:p-10 ${
        plan.featured
          ? 'bg-[#0052FF] text-white shadow-2xl shadow-blue-500/40 scale-100 lg:scale-105 z-10'
          : 'bg-white border border-slate-100 text-[#001A4D] shadow-xl shadow-slate-200/40 hover:-translate-y-1 hover:shadow-2xl'
      }`}
    >
      {/* Tag */}
      {plan.tag && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFF4D4] text-[#855B00] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-[#FFE18A] whitespace-nowrap">
          {plan.tag}
        </span>
      )}

      {/* Plan Name */}
      <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${plan.featured ? 'text-blue-200' : 'text-slate-400'}`}>
        {plan.name}
      </h3>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-5xl font-extrabold tracking-tight ${plan.featured ? 'text-white' : 'text-[#001A4D]'}`}>
          {formatPrice(price)}
        </span>
        <span className={`text-sm font-semibold ${plan.featured ? 'text-blue-200' : 'text-slate-400'}`}>
          {periodLabel}
        </span>
      </div>

      {/* Savings badge */}
      {cycle === 'annual' && (
        <div className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full mb-3 w-fit ${
          plan.featured
            ? 'bg-white/20 text-white'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        }`}>
          <Zap className="w-3 h-3" /> Save {formatPrice(savings)} vs monthly
        </div>
      )}
      {cycle === 'monthly' && (
        <p className={`text-[11px] font-semibold mb-3 ${plan.featured ? 'text-blue-200' : 'text-emerald-600'}`}>
          ✓ 14-day free trial included
        </p>
      )}

      {/* Description */}
      <p className={`text-sm font-medium leading-relaxed mb-8 ${plan.featured ? 'text-blue-100' : 'text-slate-500'}`}>
        {plan.desc}
      </p>

      {/* Features */}
      <ul className="space-y-3 flex-grow mb-10">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 mt-0.5 ${plan.featured ? 'text-blue-200' : 'text-[#0052FF]'}`}
            />
            <span className={`font-medium ${plan.featured ? 'text-white' : 'text-slate-700'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={plan.ctaHref}
        className={`w-full py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group mt-auto ${
          plan.featured
            ? 'bg-white text-[#0052FF] hover:bg-blue-50 shadow-lg'
            : 'bg-[#EAF5FD] text-[#003399] hover:bg-blue-100'
        }`}
      >
        {plan.cta}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default function PricingSection() {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section className="py-28 bg-slate-50 relative overflow-hidden" id="pricing">
      {/* Soft blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-100/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block bg-[#EAF5FD] text-[#0052FF] text-xs font-bold px-4 py-1.5 rounded-full mb-5 border border-blue-100">
            Simple, Transparent Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#001A4D] mb-5 tracking-tight">
            Flexible Plans for Every Stage.
          </h2>
          <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10">
            Every plan starts with a <span className="text-[#0052FF] font-bold">14-day free trial</span> — no credit card required. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm gap-1">
            <button
              onClick={() => setCycle('monthly')}
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                cycle === 'monthly'
                  ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
                cycle === 'annual'
                  ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Annual
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                cycle === 'annual'
                  ? 'bg-white/25 text-white'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                Save 2 Months
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} cycle={cycle} />
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-500 font-medium mb-4">
            Need more than 3 stores or a fully custom solution?
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-[#0052FF] font-bold hover:underline text-base group"
          >
            View Enterprise plans
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
