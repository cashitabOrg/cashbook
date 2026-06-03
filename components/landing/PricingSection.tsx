import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  desc: string;
  features: string[];
  cta: string;
  ctaHref: string;
  featured?: boolean;
  tag?: string;
}

function PricingCard({ name, price, period, desc, features, cta, ctaHref, featured = false, tag }: PricingCardProps) {
  return (
    <div className={`relative p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] transition-all duration-300 flex flex-col h-full ${featured ? 'bg-[#0052FF] text-white shadow-2xl shadow-blue-500/40 scale-100 lg:scale-105 z-10 border-0' : 'bg-white border border-slate-100 text-[#001A4D] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1'}`}>
      {tag && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFF4D4] text-[#855B00] text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-[#FFE18A] whitespace-nowrap">
          {tag}
        </span>
      )}

      <div className="mb-8">
        <h3 className={`text-xl font-bold mb-3 ${featured ? 'text-blue-100' : 'text-slate-500'}`}>{name}</h3>
        <div className="flex items-baseline gap-1 mb-1">
          <span className={`text-5xl font-extrabold tracking-tight ${featured ? 'text-white' : 'text-[#001A4D]'}`}>{price}</span>
          {period && <span className={`text-base font-semibold ${featured ? 'text-blue-200' : 'text-slate-500'}`}>{period}</span>}
        </div>
        <p className={`text-xs font-semibold mb-4 ${featured ? 'text-blue-200' : 'text-emerald-600'}`}>
          {name === 'Starter' ? '14-day free trial included' : name === 'Growth' ? '14-day free trial included' : name === 'Business' ? '14-day free trial included' : ''}
        </p>
        <p className={`text-sm font-medium leading-relaxed ${featured ? 'text-blue-100' : 'text-slate-500'}`}>{desc}</p>
      </div>

      <div className="flex-grow mb-10">
        <ul className="space-y-4">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm font-bold">
              <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${featured ? 'text-white fill-blue-400' : 'text-white fill-green-500'}`} />
              <span className={featured ? 'text-white' : 'text-slate-700'}>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={ctaHref}
        className={`w-full py-4 rounded-xl text-base font-bold transition-all mt-auto flex items-center justify-center gap-2 group ${featured ? 'bg-white text-[#0052FF] hover:bg-blue-50 shadow-lg' : 'bg-[#EAF5FD] text-[#003399] hover:bg-blue-100'}`}
      >
        {cta}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default function PricingSection() {
  return (
    <section className="py-24 bg-slate-50 relative" id="pricing">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-block bg-[#EAF5FD] text-[#0052FF] text-xs font-bold px-4 py-1.5 rounded-full mb-5 border border-blue-100">
            Simple, Transparent Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#001A4D] mb-6 tracking-tight">Flexible Plans for Every Stage.</h2>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Every plan starts with a <span className="text-[#0052FF] font-bold">14-day free trial</span> — no credit card required. Cancel anytime.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-8 max-w-6xl mx-auto items-center">
          <PricingCard
            name="Starter"
            price="₦7,500"
            period="/month"
            desc="Perfect for single-store setups. POS, stock tracking, offline mode, and remote monitoring."
            features={[
              "1 store location",
              "2 staff accounts",
              "1 admin account",
              "POS access & Stock tracking",
              "Offline mode & Variance tracking",
              "90 days transaction history",
              "Remote monitoring",
            ]}
            cta="Start Free Trial"
            ctaHref="/register"
          />
          <PricingCard
            name="Growth"
            price="₦15,000"
            period="/month"
            featured={true}
            tag="Most Popular"
            desc="Everything in Starter, plus more staff accounts, 180-day history, and export reports."
            features={[
              "Everything in Starter",
              "5 staff accounts",
              "180 days transaction history",
              "Export reports",
              "Priority support",
            ]}
            cta="Start Free Trial"
            ctaHref="/register"
          />
          <PricingCard
            name="Business"
            price="₦35,000"
            period="/month"
            desc="Multi-store control, unlimited staff, and full transaction history for advanced merchants."
            features={[
              "Everything in Growth",
              "3 store locations",
              "2 admin accounts",
              "Unlimited staff",
              "Unlimited transaction history",
              "Multi store dashboard",
            ]}
            cta="Start Free Trial"
            ctaHref="/register"
          />
        </div>

        <div className="text-center mt-14">
          <p className="text-slate-500 font-medium mb-4">Need more than 3 stores? Looking for a custom solution?</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-[#0052FF] font-bold hover:underline text-base"
          >
            View all plans including Enterprise <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
