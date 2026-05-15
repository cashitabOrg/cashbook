import { ShieldCheck } from 'lucide-react';

function PricingCard({ name, price, desc, features, cta, featured = false }: { name: string, price: string, desc: string, features: string[], cta: string, featured?: boolean }) {
  return (
    <div className={`relative p-8 rounded-[2rem] border transition-all ${featured ? 'bg-blue-600 border-blue-400 shadow-2xl shadow-blue-500/20 scale-105 z-10' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
      {featured && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Most Popular</span>}
      <h3 className={`text-xl font-black uppercase tracking-tighter mb-2 ${featured ? 'text-white' : 'text-slate-200'}`}>{name}</h3>
      <div className="flex items-baseline gap-1 mb-4">
        <span className={`text-4xl font-black ${featured ? 'text-white' : 'text-white'}`}>{price}</span>
        {price !== "Free" && <span className={`text-sm ${featured ? 'text-blue-100' : 'text-slate-500'}`}>/month</span>}
      </div>
      <p className={`text-sm font-medium leading-relaxed mb-8 ${featured ? 'text-blue-50' : 'text-slate-500'}`}>{desc}</p>
      <ul className="space-y-4 mb-8">
        {features.map((f, i) => (
          <li key={i} className={`flex items-center gap-3 text-xs font-bold ${featured ? 'text-white' : 'text-slate-300'}`}>
            <ShieldCheck className={`w-4 h-4 ${featured ? 'text-blue-200' : 'text-blue-500'}`} />
            {f}
          </li>
        ))}
      </ul>
      <button className={`w-full py-4 rounded-xl font-black uppercase tracking-tight transition-all ${featured ? 'bg-white text-blue-600 hover:bg-slate-100 shadow-xl' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
        {cta}
      </button>
    </div>
  )
}

export default function PricingSection() {
  return (
    <section className="py-24 bg-slate-900/40 border-t border-slate-800/50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 uppercase tracking-tighter">Flexible Plans.</h2>
          <p className="text-lg text-slate-400 font-medium italic">"The right tools for every stage of your frozen food business growth."</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard 
            name="Lite" 
            price="Free" 
            desc="Perfect for single-store setups starting their journey."
            features={["1 Store Location", "Basic Inventory", "Daily Sales Reports", "Email Support"]}
            cta="Start Free"
          />
          <PricingCard 
            name="Professional" 
            price="Custom" 
            featured={true}
            desc="The standard for multi-store retail expansion."
            features={["Unlimited Stores", "Full Sales Intelligence", "Offline Cloud Sync", "Priority Audit Engine", "24/7 Support"]}
            cta="Talk to Sales"
          />
          <PricingCard 
            name="Enterprise" 
            price="Quote" 
            desc="Bespoke features for large cold-chain distributions."
            features={["Custom Analytics", "API Access", "Dedicated Infrastructure", "On-site Training"]}
            cta="Get a Quote"
          />
        </div>
      </div>
    </section>
  );
}
