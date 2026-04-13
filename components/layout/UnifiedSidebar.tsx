"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  History,
  Users,
  FileText,
  Zap,
  ShieldCheck,
  Rocket,
  Star
} from "lucide-react";

const IconMap: Record<string, any> = {
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  History,
  Users,
  FileText
};

type NavItem = {
  name: string;
  href: string;
  icon: string;
};

interface UnifiedSidebarProps {
  storeName: string;
  roleLabel: string;
  navItems: NavItem[];
  signOutAction: any;
  accentColor?: string;
  plan?: string;
  isExempt?: boolean;
}

export default function UnifiedSidebar({
  storeName,
  roleLabel,
  navItems,
  signOutAction,
  accentColor = "bg-blue-600",
  plan = "free",
  isExempt = false
}: UnifiedSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Sync state with localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    setIsCollapsed(saved === "true");
    setIsMounted(true);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col shrink-0"></aside>
    );
  }

  return (
    <aside 
      className={`bg-slate-900 border-r border-slate-800 hidden md:flex flex-col shrink-0 transition-all duration-300 relative group overflow-hidden ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className={`h-22 border-b border-slate-800 flex items-center transition-all ${isCollapsed ? "px-4 justify-center" : "px-5 py-6 gap-3 relative"}`}>
        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 select-none border border-white/10 relative overflow-hidden">
          <img src="/logo-icon.png" alt="Logo" className="w-full h-full object-contain p-1" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-black tracking-tighter uppercase leading-none text-base text-white underline decoration-blue-500/30">
              CASHITAB
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
               {plan === 'pro' ? (
                 <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[8px] font-black uppercase tracking-tighter shadow-sm">
                   <Star className="w-2.5 h-2.5 fill-indigo-400" /> PRO
                 </span>
               ) : plan === 'basic' ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[8px] font-black uppercase tracking-tighter shadow-sm">
                   <Rocket className="w-2.5 h-2.5" /> BASIC
                 </span>
               ) : (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-md text-[8px] font-black uppercase tracking-tighter shadow-sm">
                   <ShieldCheck className="w-2.5 h-2.5" /> FREE
                 </span>
               )}
               <span className="text-[10px] text-slate-600 font-bold truncate opacity-40 tracking-wider uppercase">— {storeName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const Icon = IconMap[item.icon] || FileText;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : ""}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all group/item whitespace-nowrap ${
                isActive 
                  ? "bg-slate-800 text-white shadow-lg" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? "scale-110" : "group-hover/item:scale-110"}`} />
              {!isCollapsed && (
                <span className="text-sm font-bold tracking-tight">{item.name}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Upgrade Nudge */}
      {!isCollapsed && plan === 'free' && !isExempt && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-xl group/upgrade relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover/upgrade:bg-blue-500/20 transition-all pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3 fill-blue-400" /> Growth Ready?
            </p>
            <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed">
              Unlock unlimited products and advanced BI tools.
            </p>
            <div className="mt-3 text-[10px] font-black text-white p-1 rounded-md text-center bg-blue-600/20 border border-blue-500/20 group-hover/upgrade:bg-blue-600 transition-all cursor-pointer select-none">
               VIEW PLATFORM OFFERS
            </div>
          </div>
        </div>
      )}

      {/* Footer / Toggle & SignOut */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-4 w-full px-3 py-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all group/toggle"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 mx-auto group-hover/toggle:scale-110" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 group-hover/toggle:scale-110" />
              <span className="text-xs font-black uppercase tracking-widest">Collapse Menu</span>
            </>
          )}
        </button>

        <form action={signOutAction}>
          <button
            type="submit"
            className={`flex items-center gap-4 px-3 py-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all w-full overflow-hidden ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-bold tracking-tight">Sign out</span>
            )}
          </button>
        </form>
      </div>
    </aside>
  );
}
