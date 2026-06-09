'use client';

import React, { useEffect, useState } from 'react';

export default function PwaSplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Only execute on client-side
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    const hasShown = sessionStorage.getItem('pwa-splash-shown');

    if (isStandalone && !hasShown) {
      setIsVisible(true);
      // Disable scrolling during splash screen
      document.body.style.overflow = 'hidden';

      // Start fade out at 2.4 seconds
      const fadeTimeout = setTimeout(() => {
        setIsFadingOut(true);
      }, 2400);

      // Remove splash completely and restore scroll at 2.9 seconds
      const endTimeout = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
        sessionStorage.setItem('pwa-splash-shown', 'true');
      }, 2900);

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(endTimeout);
        document.body.style.overflow = '';
      };
    }
  }, []);

  if (!isVisible) return null;

  const title = "CASHITAB";

  return (
    <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none font-sans overflow-hidden bg-slate-50 ${isFadingOut ? 'animate-splash-fade-out' : ''}`}>
      {/* Background Image with Scale-Down Animation */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-bg-scale-down"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      >
        {/* Soft dark filter to elevate glass card details */}
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" />
      </div>

      {/* Decorative Blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0052FF]/10 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse" />

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center animate-card-entrance">
        <div className="w-full bg-white/95 backdrop-blur-2xl border border-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 flex flex-col items-center">
          
          {/* Logo & Ring Spinner Container */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-6">
            {/* Spinning Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-100/50" />
            <div className="absolute inset-0 rounded-full border-4 border-[#0052FF] border-t-transparent animate-spin" />
            
            {/* Pulsing Outer Glow */}
            <div className="absolute inset-0 rounded-full bg-[#0052FF]/10 animate-ping opacity-75" />

            {/* Inner Logo */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md z-10 relative overflow-hidden p-2.5 animate-logo-bounce">
              <img src="/Logo_cashitab.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Title with Staggered Letter Entrance */}
          <div className="flex flex-col items-center text-center w-full">
            <div className="flex items-center space-x-1 mb-1">
              {title.split("").map((letter, index) => (
                <span 
                  key={index} 
                  className="text-2xl font-black tracking-wider text-[#001A4D] inline-block animate-letter-slide-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="text-slate-500 font-bold text-sm tracking-wide uppercase opacity-0 animate-fade-in-delayed">
              Smart POS & Inventory
            </p>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full mt-8 space-y-3">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0052FF] to-blue-400 rounded-full animate-fill-progress" />
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span className="animate-shimmer-text">Secure PWA Launch...</span>
              <span className="animate-shimmer-text">Ready</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bgScaleDown {
          0% { transform: scale(1.12); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cardEntrance {
          0% { transform: scale(0.9) translateY(30px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes logoBounce {
          0% { transform: scale(0); }
          60% { transform: scale(1.15); }
          85% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes letterSlideUp {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInDelayed {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fillProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes splashFadeOut {
          0% { opacity: 1; transform: scale(1); filter: blur(0px); }
          100% { opacity: 0; transform: scale(1.04); filter: blur(2px); }
        }
        
        .animate-bg-scale-down {
          animation: bgScaleDown 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .animate-card-entrance {
          animation: cardEntrance 1.0s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-logo-bounce {
          animation: logoBounce 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-letter-slide-up {
          animation: letterSlideUp 0.6s cubic-bezier(0.25, 1, 0.5, 1) both;
        }
        .animate-fade-in-delayed {
          animation: fadeInDelayed 0.8s ease-out forwards;
          animation-delay: 800ms;
        }
        .animate-fill-progress {
          animation: fillProgress 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-shimmer-text {
          animation: shimmer 1.2s ease-in-out infinite;
        }
        .animate-splash-fade-out {
          animation: splashFadeOut 0.55s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
    </div>
  );
}
