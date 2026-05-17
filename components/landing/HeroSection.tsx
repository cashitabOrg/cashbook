import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 pt-12 md:pt-20 pb-16 flex flex-col md:flex-row items-center justify-between relative">
      <div className="md:w-[45%] max-w-xl z-10 text-left shrink-0">
        <div className="inline-block bg-[#FFF4D4] text-[#855B00] text-xs font-bold px-3 py-1 rounded-full mb-6 shadow-sm border-2 border-[#FFE18A]">
          Nigeria's Fastest Growing Inventory Management Solution
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-[72px] font-bold text-[#001A4D] leading-[1.05] mb-6 tracking-tight">
          Easy solution to power your business.
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-md font-medium">
          Track inventory, monitor business growth and revenue with a solution
          that meets all your needs.
        </p>

        <Link
          href="/register"
          className="inline-block bg-[#0052FF] text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
        >
          Start Now
        </Link>
      </div>

      <div className="md:w-[55%] relative mt-20 md:mt-0 flex justify-center lg:justify-end z-10 w-full">
        <div className="relative w-full max-w-[650px] z-10 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl shadow-blue-500/20">
          <img
            src="/hero-guy.png"
            alt="Smiling business man"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  );
}
