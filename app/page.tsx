import Link from 'next/link'
import { ArrowRight, Snowflake, BarChart3, ShieldCheck, WifiOff, Store } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Background Effects */}
      <div className="absolute top-0 inset-x-0 h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[150px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-cyan-500/20">
            <Snowflake className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-500">
            FrozenPOS
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">
            Sign In
          </Link>
          <Link href="/register" className="text-sm font-semibold bg-white text-slate-900 px-5 py-2.5 rounded-full hover:bg-cyan-50 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
            Start Free Trial
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-24 pb-32 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-md mb-8">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">v2.0 Early Access is Live</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15] mb-8">
          The Ultimate SaaS POS for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
            Frozen Food Stores.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-light">
          Manage multiple branches, track inventory with precision, and process sales smoothly—even offline. Built exclusively to keep your cold chain business running hot.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/register" className="group flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-full text-base font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25">
            Get Started Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 rounded-full text-base font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors">
            View Live Demo
          </button>
        </div>

        {/* Feature Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto text-left">
          <FeatureCard 
            icon={<Store className="w-6 h-6 text-cyan-400" />}
            title="Multi-Store Control"
            desc="Manage separate inventories, managers, and sales points from one super admin dashboard."
          />
          <FeatureCard 
            icon={<WifiOff className="w-6 h-6 text-blue-400" />}
            title="Offline-First Engine"
            desc="Keep selling when the internet drops. Sales auto-sync to the cloud once you're back online."
          />
          <FeatureCard 
            icon={<BarChart3 className="w-6 h-6 text-indigo-400" />}
            title="Real-time Analytics"
            desc="Instant insights on low stock, daily revenue, and best-selling frozen goods."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-emerald-400" />}
            title="Role-Based Security"
            desc="Strict permissions for managers, admins, and cashiers so your data stays safe."
          />
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm hover:bg-slate-800/60 hover:border-slate-700 transition-all">
      <div className="bg-slate-800/80 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed font-light">{desc}</p>
    </div>
  )
}
