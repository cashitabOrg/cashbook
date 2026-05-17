import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import HeroSection from "@/components/landing/HeroSection";
import IntelligenceSection from "@/components/landing/IntelligenceSection";
import Navbar from "@/components/landing/Navbar";
import PricingSection from "@/components/landing/PricingSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-900 font-sans selection:bg-blue-200 relative bg-[#EAF5FD] overflow-hidden">
      {/* Background wavy curves */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden z-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 800"
          className="absolute w-full h-full text-blue-100/50"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,200 C300,300 600,100 900,200 C1200,300 1440,150 1440,150 L1440,0 L0,0 Z"
          ></path>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M0,400 C400,500 800,200 1440,400"
          ></path>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M0,600 C500,700 900,400 1440,500"
          ></path>
        </svg>
      </div>

      <Navbar />

      <main className="relative z-10">
        <HeroSection />
        <IntelligenceSection />

        <div className="relative">
          <PricingSection />
          <FinalCTA />
          <Footer />
        </div>
      </main>
    </div>
  );
}
