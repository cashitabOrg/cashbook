import { ShieldCheck } from 'lucide-react';

export default function IntelligenceSection() {
  return (
    <section className="py-24 bg-slate-950/40 border-y border-slate-800/50 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Sales Intelligence</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight uppercase tracking-tighter">
              Real-time Auditing <br /> & Performance Tracking.
            </h3>
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">
              Never lose track of a single naira. Our automated audit engine flags discrepancies instantly, while the Performance Index gives you a live scoreboard of your store's health.
            </p>
            <ul className="space-y-4">
              {[
                "Automated Variance Detection",
                "Sales Performance Index (SPI)",
                "Audit Ledger with Live Reconciliations",
                "Predictive Stock-out Alerts"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-200 font-bold">
                  <div className="bg-blue-500/20 p-1 rounded-md">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center p-0">
              <img src="/dashboard-mockup.png" alt="CASHITAB Intelligence Dashboard" className="w-full h-auto object-contain max-h-[450px]" />
              <div className="absolute top-6 right-6 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">Performance: 92%</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
