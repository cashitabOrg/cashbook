import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
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
  );
}
