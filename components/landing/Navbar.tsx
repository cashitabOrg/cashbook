import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="relative z-50 container mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-[#003399] p-1.5 rounded-lg w-8 h-8 flex items-center justify-center shadow-md">
            <span className="text-white font-black italic text-sm">C</span>
          </div>
          <span className="text-xl font-extrabold text-[#003399] tracking-tight">
            CASHITAB
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#"
            className="text-sm font-bold text-[#003399] hover:text-blue-700"
          >
            Business
          </Link>
          <Link
            href="#"
            className="text-sm font-bold text-slate-500 hover:text-[#003399]"
          >
            Personal
          </Link>
        </nav>
      </div>

      <nav className="hidden lg:flex items-center gap-8">
        <div className="flex items-center gap-1 cursor-pointer group text-sm font-semibold text-slate-600 hover:text-[#003399]">
          Products{" "}
          <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
        </div>
        <Link
          href="#"
          className="text-sm font-semibold text-slate-600 hover:text-[#003399]"
        >
          About
        </Link>
        <Link
          href="#"
          className="text-sm font-semibold text-slate-600 hover:text-[#003399]"
        >
          Contact
        </Link>
        <Link
          href="#"
          className="text-sm font-semibold text-slate-600 hover:text-[#003399]"
        >
          Blog
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm font-bold bg-[#DCEBFF] text-[#003399] px-6 py-2.5 rounded-full hover:bg-blue-100 transition-colors"
        >
          Sign in <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="hidden sm:flex items-center gap-1 text-[#003399] font-bold cursor-pointer bg-white px-2 py-1 rounded-full shadow-sm border border-slate-100">
          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center overflow-hidden border-[1.5px] border-white">
            <div className="w-1.5 h-4 bg-white"></div>
          </div>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
