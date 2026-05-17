import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 container mx-auto px-4 sm:px-6 text-center">
      <div className="bg-[#0052FF] p-12 sm:p-20 rounded-[3rem] shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute w-[200%] h-[200%] -top-[50%] -right-[50%] animate-[spin_60s_linear_infinite]">
            <path fill="currentColor" d="M38,65.3c-7.5-3.1-13.8-8.8-17.6-15.9c-3.8-7.1-5-15.5-3.3-23.4c1.7-7.9,6.1-15,12.3-19.8 C35.6,1.4,43.6-1,51.7-1c8.1,0,16.1,2.4,22.3,7.2c6.2,4.8,10.6,11.9,12.3,19.8c1.7,7.9,0.5,16.3-3.3,23.4c-3.8,7.1-10.1,12.8-17.6,15.9 C58,68.4,45.5,68.4,38,65.3z" />
          </svg>
        </div>
        
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight relative z-10 transition-transform group-hover:scale-[1.02] duration-500">
          Ready to automate <br /> your business operations?
        </h2>
        <p className="text-blue-100 text-lg sm:text-xl font-medium max-w-2xl mx-auto mb-10 relative z-10">
          Join thousands of businesses managing their inventory, tracking sales, and growing their revenue with CASHITAB.
        </p>
        <Link href="/register" className="inline-flex items-center gap-3 bg-white text-[#0052FF] px-10 py-4 rounded-xl text-lg font-bold hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1 relative z-10">
          Activate Now
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
