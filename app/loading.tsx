'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-[#0052FF]/20 font-sans relative overflow-hidden bg-slate-50">
      {/* Background Image with Light Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-fade-in"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      >
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
      </div>

      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0052FF]/10 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse" />

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        <div className="w-full bg-white/95 backdrop-blur-2xl border border-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 flex flex-col items-center">
          
          {/* Logo & Ring Spinner Container */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-6">
            {/* Spinning Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-100/50" />
            <div className="absolute inset-0 rounded-full border-4 border-[#0052FF] border-t-transparent animate-spin" />
            
            {/* Pulsing Outer Glow */}
            <div className="absolute inset-0 rounded-full bg-[#0052FF]/10 animate-ping opacity-75" />

            {/* Inner Logo */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md z-10 relative overflow-hidden p-2.5">
              <img src="/Logo_cashitab.png" alt="Logo" className="w-full h-full object-contain animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col items-center text-center w-full">
            <span className="text-2xl font-black tracking-tight text-[#001A4D] uppercase mb-1">Cashitab</span>
            <p className="text-slate-500 font-bold text-sm tracking-wide uppercase">Smart POS & Inventory</p>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full mt-8 space-y-3">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0052FF] to-blue-400 rounded-full animate-progress-bar" />
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span className="animate-shimmer-text">Loading workspace...</span>
              <span className="animate-shimmer-text">Please wait</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; left: 0%; }
          50% { width: 70%; left: 15%; }
          100% { width: 100%; left: 0%; }
        }
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-progress-bar {
          animation: progress 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-shimmer-text {
          animation: shimmer 1.5s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
