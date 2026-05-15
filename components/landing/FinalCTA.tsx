import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
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
  );
}
