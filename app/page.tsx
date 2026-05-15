import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import IntelligenceSection from '@/components/landing/IntelligenceSection'
import FeatureGrid from '@/components/landing/FeatureGrid'
import PricingSection from '@/components/landing/PricingSection'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-50 overflow-hidden font-sans selection:bg-cyan-500/30 relative bg-slate-950">
      {/* Background Image with Blue Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      >
        <div className="absolute inset-0 bg-blue-950/85 backdrop-blur-[1px]" />
      </div>

      {/* Background glow shadow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <Navbar />

      <main className="relative z-10">
        <HeroSection />
        <IntelligenceSection />
        <FeatureGrid />
        <PricingSection />
        <FinalCTA />
        <Footer />
      </main>
    </div>
  )
}
