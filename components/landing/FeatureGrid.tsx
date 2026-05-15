import { BarChart3, ShieldCheck, WifiOff, Store } from 'lucide-react';

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-slate-900/20 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-sm hover:bg-slate-900 transition-all group">
      <div className="bg-slate-800/80 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-slate-700/50 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-lg font-black text-white mb-3 uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  )
}

export default function FeatureGrid() {
  return (
    <section className="py-24 container mx-auto px-4 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 uppercase tracking-tighter">Built for Scale.</h2>
        <p className="text-lg text-slate-400 font-medium">Standard POS systems fail under pressure. CASHITAB is built with an offline-first engine and cloud synchronization to ensure your data stays safe, even with no signal.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <FeatureCard 
          icon={<Store className="w-6 h-6 text-blue-400" />}
          title="Multi-Store Control"
          desc="Manage separate inventories, managers, and sales points from one unified super admin dashboard."
        />
        <FeatureCard 
          icon={<WifiOff className="w-6 h-6 text-cyan-400" />}
          title="Offline-First Sync"
          desc="Keep selling when the internet drops. Sales auto-reconcile to the cloud once you're back online."
        />
        <FeatureCard 
          icon={<ShieldCheck className="w-6 h-6 text-indigo-400" />}
          title="Audit Guard"
          desc="Every price change and refund is logged. Monitor manager corrections with a full history audit trail."
        />
        <FeatureCard 
          icon={<BarChart3 className="w-6 h-6 text-emerald-400" />}
          title="Inventory Precision"
          desc="Track weight-based (kg) and piece-based stock with automated threshold alerts for restocks."
        />
      </div>
    </section>
  );
}
