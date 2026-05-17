import { CheckCircle2 } from 'lucide-react';

function PricingCard({ name, price, desc, features, cta, featured = false }: { name: string, price: string, desc: string, features: string[], cta: string, featured?: boolean }) {
  return (
    <div className={`relative p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] transition-all duration-300 flex flex-col h-full ${featured ? 'bg-[#0052FF] text-white shadow-2xl shadow-blue-500/40 scale-100 lg:scale-105 z-10 border-0' : 'bg-white border border-slate-100 text-[#001A4D] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1'}`}>
      {featured && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFF4D4] text-[#855B00] text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-[#FFE18A]">
          Most Popular
        </span>
      )}
      
      <div className="mb-8">
        <h3 className={`text-xl font-bold mb-3 ${featured ? 'text-blue-100' : 'text-slate-500'}`}>{name}</h3>
        <div className="flex items-baseline gap-1 mb-4">
          <span className={`text-5xl font-extrabold tracking-tight ${featured ? 'text-white' : 'text-[#001A4D]'}`}>{price}</span>
          {price !== "Free" && price !== "Custom" && price !== "Quote" && <span className={`text-base font-semibold ${featured ? 'text-blue-200' : 'text-slate-500'}`}>/month</span>}
        </div>
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

      <button className={`w-full py-4 rounded-xl text-base font-bold transition-all mt-auto ${featured ? 'bg-white text-[#0052FF] hover:bg-blue-50 shadow-lg' : 'bg-[#EAF5FD] text-[#003399] hover:bg-blue-100'}`}>
        {cta}
      </button>
    </div>
  )
}

export default function PricingSection() {
  return (
    <section className="py-24 bg-slate-50 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-[#001A4D] mb-6 tracking-tight">Flexible Plans for Every Stage.</h2>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Choose the right tools to power your business growth. No hidden fees, cancel anytime.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-8 max-w-6xl mx-auto items-center">
          <PricingCard 
            name="Starter" 
            price="Free" 
            desc="Perfect for single-store setups starting their journey and learning the ropes."
            features={["1 Store Location", "Basic Inventory Tracking", "Daily Sales Reports", "Email Support"]}
            cta="Start for Free"
          />
          <PricingCard 
            name="Professional" 
            price="₦15,000" 
            featured={true}
            desc="The standard for growing retail businesses expanding their footprint."
            features={["Up to 5 Store Locations", "Full Sales Intelligence", "Offline Cloud Sync", "Priority Audit Engine", "24/7 Dedicated Support"]}
            cta="Activate Pro"
          />
          <PricingCard 
            name="Enterprise" 
            price="Custom" 
            desc="Bespoke features and limitless scale for large distribution networks."
            features={["Unlimited Store Locations", "Custom Analytics Dashboard", "Open API Access", "Dedicated Account Manager", "On-site Staff Training"]}
            cta="Talk to Sales"
          />
        </div>
      </div>
    </section>
  );
}
