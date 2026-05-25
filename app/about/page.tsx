import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import FinalCTA from "@/components/landing/FinalCTA";

export default function AboutPage() {
  return (
    <div className="min-h-screen text-slate-900 font-sans selection:bg-blue-200 relative bg-[#EAF5FD] overflow-hidden">
      <Navbar />
      <main className="relative z-10">
        <section className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <h1 className="text-4xl md:text-6xl font-black text-[#001A4D] tracking-tight mb-6">
              Powering the next generation of retail.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
              We built Cashitab to make enterprise-grade POS and inventory intelligence accessible to ambitious businesses everywhere.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-[#001A4D] mb-6">Our Mission</h2>
                <p className="text-slate-600 font-medium leading-relaxed mb-6">
                  At Cashitab, we believe that managing a business shouldn't mean being tied down to clunky, outdated software. Our mission is to empower merchants with smart, seamless, and deeply analytical tools that drive growth and eliminate operational friction.
                </p>
                <p className="text-slate-600 font-medium leading-relaxed">
                  From multi-store synchronization to real-time inventory tracking, we are committed to providing a reliable foundation for your business to scale on.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#EAF5FD] p-6 rounded-2xl shadow-sm border border-slate-50">
                  <h3 className="text-4xl font-black text-[#0052FF] mb-2">10k+</h3>
                  <p className="text-sm font-bold text-slate-600">Active Merchants</p>
                </div>
                <div className="bg-[#EAF5FD] p-6 rounded-2xl shadow-sm border border-slate-50">
                  <h3 className="text-4xl font-black text-[#0052FF] mb-2">$2B+</h3>
                  <p className="text-sm font-bold text-slate-600">Processed Annually</p>
                </div>
                <div className="bg-[#EAF5FD] p-6 rounded-2xl shadow-sm border border-slate-50">
                  <h3 className="text-4xl font-black text-[#0052FF] mb-2">99.9%</h3>
                  <p className="text-sm font-bold text-slate-600">Uptime Reliability</p>
                </div>
                <div className="bg-[#EAF5FD] p-6 rounded-2xl shadow-sm border border-slate-50">
                  <h3 className="text-4xl font-black text-[#0052FF] mb-2">24/7</h3>
                  <p className="text-sm font-bold text-slate-600">Expert Support</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FinalCTA />
        <Footer />
      </main>
    </div>
  );
}
