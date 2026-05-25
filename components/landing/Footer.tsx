import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/Logo_cashitab.png" alt="Logo" className="w-10 h-10 object-contain" />
              <span className="text-xl font-extrabold text-[#0052FF] tracking-tight">CASHITAB</span>
            </div>
            <p className="text-slate-600 font-medium max-w-sm leading-relaxed text-sm">
              The smartest sales intelligence and inventory management platform built to power your business growth.
            </p>
          </div>
          <div>
            <h4 className="text-[#001A4D] font-bold text-sm mb-6">Products</h4>
            <ul className="space-y-4 text-slate-500 text-sm font-semibold">
              <li><Link href="/login" className="hover:text-[#003399] transition-colors">Dashboard</Link></li>
              <li><Link href="#" className="hover:text-[#003399] transition-colors">Intelligence</Link></li>
              <li><Link href="#" className="hover:text-[#003399] transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-[#003399] transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#001A4D] font-bold text-sm mb-6">Company</h4>
            <ul className="space-y-4 text-slate-500 text-sm font-semibold">
              <li><Link href="#" className="hover:text-[#003399] transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-[#003399] transition-colors">FAQ</Link></li>
              <li><Link href="#" className="hover:text-[#003399] transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-[#003399] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs font-semibold">
            &copy; {new Date().getFullYear()} CASHITAB. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-slate-500 cursor-pointer hover:text-[#0052FF] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </span>
            <span className="text-slate-500 cursor-pointer hover:text-[#0052FF] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
