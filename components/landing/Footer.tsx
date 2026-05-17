import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-[#003399] p-1.5 rounded-lg w-8 h-8 flex items-center justify-center shadow-md">
                <span className="text-white font-black italic text-sm">C</span>
              </div>
              <span className="text-xl font-extrabold text-[#003399] tracking-tight">CASHITAB</span>
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
            <span className="text-slate-500 text-xs font-semibold cursor-pointer hover:text-[#003399]">Twitter</span>
            <span className="text-slate-500 text-xs font-semibold cursor-pointer hover:text-[#003399]">LinkedIn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
