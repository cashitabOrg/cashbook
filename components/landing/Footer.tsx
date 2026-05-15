import Link from 'next/link';

export default function Footer() {
  return (
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
  );
}
