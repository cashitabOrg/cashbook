import Link from 'next/link'
import { ArrowRight, Snowflake, BarChart3, ShieldCheck, WifiOff, Store } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-50 overflow-hidden font-sans selection:bg-cyan-500/30 relative bg-slate-950">
      {/* Background Image with Blue Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      >
        <div className="absolute inset-0 bg-blue-950/85 backdrop-blur-[1px]" />
      </div>

      {/* Background glow shadow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Navbar */}
      <header className="relative z-50 container mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 shrink-0 border border-white/10 transition-transform group-hover:scale-105 w-11 h-11 flex items-center justify-center overflow-hidden">
            <img src="/logo-icon.png" alt="CASHITAB" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white uppercase select-none">
            CASHITAB
          </span>
        </div>
        <nav className="flex items-center gap-3 sm:gap-8">
          <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-300 hover:text-white transition-colors tracking-wide uppercase">
            Sign In
          </Link>
          <Link href="/register" className="text-xs sm:text-sm font-black bg-white text-slate-900 px-6 py-3 rounded-full hover:bg-blue-50 transition-all shadow-xl hover:shadow-white/10 uppercase tracking-tight">
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="container mx-auto px-4 sm:px-6 pt-20 md:pt-32 pb-24 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-blue-300 uppercase tracking-[0.2em]">v2.0 Early Access is Live</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-[-0.04em] max-w-5xl mx-auto leading-[1] mb-8 text-white uppercase">
            The Ultimate Smart POS for <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 block sm:inline mt-2 sm:mt-0 tracking-tighter">
              CASHITAB.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300/80 max-w-3xl mx-auto mb-12 font-medium px-4 leading-relaxed tracking-tight">
            Manage multiple branches, track inventory with precision, and outsmart your sales data. Built exclusively to keep your cold chain business running hot.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-4 sm:px-0">
            <Link href="/register" className="w-full sm:w-auto justify-center group flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-2xl text-base sm:text-lg font-black hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/30 uppercase tracking-tight">
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto justify-center px-10 py-5 rounded-2xl text-base sm:text-lg font-bold text-slate-300 border-2 border-slate-700/50 hover:bg-slate-800/50 backdrop-blur-sm transition-all uppercase tracking-tight">
              Watch Demo
            </button>
          </div>
        </section>

        {/* Intelligence Section */}
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
                <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden aspect-[16/10] flex items-center justify-center">
                  <img src="/dashboard-mockup.png" alt="CASHITAB Intelligence Dashboard" className="w-full h-full object-cover" />
                  <div className="absolute top-6 right-6 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">Performance: 92%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
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

        {/* Pricing Section */}
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

        {/* Final CTA */}
        <section className="py-24 container mx-auto px-4 sm:px-6 text-center">
          <div className="bg-blue-950/70 backdrop-blur-3xl border border-blue-500/10 p-12 sm:p-20 rounded-[3rem] shadow-[0_0_100px_rgba(37,99,235,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] -mr-40 -mt-40 transition-all duration-1000 group-hover:scale-110" />
            <h2 className="text-3xl sm:text-6xl font-black text-white mb-8 leading-tight uppercase tracking-tighter relative z-10 transition-transform group-hover:scale-[1.02]">
              Ready to automate <br /> your cold store?
            </h2>
            <Link href="/register" className="inline-flex items-center gap-3 bg-white text-blue-700 px-12 py-5 rounded-2xl text-xl font-black hover:bg-slate-50 transition-all shadow-xl shadow-blue-500/10 uppercase tracking-tight relative z-10">
              Launch CASHITAB Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-950 border-t border-slate-900 pt-20 pb-10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-600 px-2 py-1.5 rounded-lg w-8 h-8 flex items-center justify-center">
                    <span className="text-white font-black italic text-xs">C</span>
                  </div>
                  <span className="text-xl font-black text-white uppercase tracking-tighter">CASHITAB</span>
                </div>
                <p className="text-slate-500 font-medium max-w-sm leading-relaxed text-sm">
                  The first Sales Intelligence platform built specifically for West Africa's growing cold chain and frozen food retail sector.
                </p>
              </div>
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6">Product</h4>
                <ul className="space-y-4 text-slate-500 text-sm font-bold">
                  <li><Link href="/login" className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
                  <li><Link href="#" className="hover:text-blue-400 transition-colors">Intelligence</Link></li>
                  <li><Link href="#" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
                  <li><Link href="#" className="hover:text-blue-400 transition-colors">Security</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6">Support</h4>
                <ul className="space-y-4 text-slate-500 text-sm font-bold">
                  <li><Link href="#" className="hover:text-blue-400 transition-colors">Contact</Link></li>
                  <li><Link href="#" className="hover:text-blue-400 transition-colors">FAQ</Link></li>
                  <li><Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                  <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-900/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                &copy; {new Date().getFullYear()} CASHITAB. All rights reserved.
              </p>
              <div className="flex gap-6">
                <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-slate-400">Twitter</span>
                <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-slate-400">LinkedIn</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

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
