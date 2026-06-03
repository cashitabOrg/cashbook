import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="relative z-50 container mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <img
            src="/Logo_cashitab.png"
            alt="Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-extrabold text-[#0052FF] tracking-tight">
            CASHITAB
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6"></nav>
      </div>

      <nav className="hidden lg:flex items-center gap-8">
        <Link
          href="/about"
          className="text-sm font-semibold text-slate-600 hover:text-[#0052FF]"
        >
          About
        </Link>
        <Link
          href="/pricing"
          className="text-sm font-semibold text-slate-600 hover:text-[#0052FF]"
        >
          Pricing
        </Link>
        <Link
          href="/contact"
          className="text-sm font-semibold text-slate-600 hover:text-[#0052FF]"
        >
          Contact
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="hidden sm:inline-flex text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-2 text-sm font-bold bg-[#0052FF] text-white px-6 py-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
