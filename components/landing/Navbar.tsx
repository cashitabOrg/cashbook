import Link from 'next/link';

export default function Navbar() {
  return (
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
  );
}
