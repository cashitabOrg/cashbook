"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "@teispace/next-themes";
import InstallAppButton from "@/components/landing/InstallAppButton";
import {
  LogOut,
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  History,
  Users,
  FileText,
  Activity,
  CreditCard,
  Settings,
  Sun,
  Moon,
} from "lucide-react";

const IconMap: Record<string, any> = {
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  History,
  Users,
  FileText,
  Activity,
  CreditCard,
  Settings,
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
  userName?: string;
}

export default function UnifiedSidebar({
  storeName,
  roleLabel,
  navItems = [],
  signOutAction,
  userName = "Admin",
}: UnifiedSidebarProps) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => setMounted(true), []);

  const displayName = userName || roleLabel || "Admin";
  const initial = displayName.charAt(0).toUpperCase();
  const isDark = resolvedTheme === "dark";

  return (
    <aside
      className={`shrink-0 hidden md:block relative z-50 transition-all duration-300 ${expanded ? "w-52" : "w-24"}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        className={`absolute top-0 left-0 h-full flex flex-col bg-gray-50 dark:bg-[#111111] border-r border-gray-200 dark:border-[#2C2C2E] overflow-hidden shadow-none transition-all duration-300 ${
          expanded ? "w-52 shadow-2xl" : "w-24"
        }`}
      >
        {/* Logo Section */}
        <div className={`h-20 flex items-center shrink-0 border-b border-gray-100 dark:border-[#1E1E1E] transition-all duration-300 ${
          expanded ? "px-5 gap-3" : "justify-center px-0"
        }`}>
          <img
            src="/Logo_cashitab.png"
            alt="Logo"
            className="w-9 h-9 object-contain shrink-0 select-none transition-all duration-300"
          />
          <div className={`flex flex-col overflow-hidden transition-all duration-300 ${
            expanded ? "opacity-100 max-w-[120px]" : "opacity-0 max-w-0"
          }`}>
            <span className="font-black tracking-tighter uppercase leading-none text-sm text-[#0052FF] dark:text-[#3B82F6]">
              CASHITAB
            </span>
            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold truncate mt-1 tracking-wider uppercase">
              {storeName}
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-5 flex flex-col gap-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = IconMap[item.icon] || FileText;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 w-full py-2.5 px-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-white bg-[#0052FF] shadow-lg shadow-[#0052FF]/25"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#2C2C2E]"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span
                  className={`text-[11px] font-bold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    expanded ? "opacity-100 max-w-[120px]" : "opacity-0 max-w-0"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Footer: Theme Toggle + Profile + Logout */}
        <div className="mt-auto border-t border-gray-200 dark:border-[#2C2C2E] py-4 px-2 flex flex-col gap-1">

          {/* PWA Install Button */}
          <InstallAppButton variant="sidebar" expanded={expanded} />

          {/* 1. Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#2C2C2E] transition-all duration-200"
            >
              {isDark ? (
                <Sun className="w-5 h-5 shrink-0 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 shrink-0 text-blue-500" />
              )}
              <span
                className={`text-[11px] font-bold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${
                  expanded ? "opacity-100 max-w-[120px]" : "opacity-0 max-w-0"
                }`}
              >
                {isDark ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
          )}

          {/* 2. Profile & Store Name */}
          <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-200 dark:hover:bg-[#2C2C2E] transition-all duration-200 cursor-default">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
              {initial}
            </div>
            {/* Name + Store */}
            <div
              className={`flex flex-col text-left overflow-hidden transition-all duration-300 ${
                expanded ? "opacity-100 max-w-[110px]" : "opacity-0 max-w-0"
              }`}
            >
              <span className="text-[11px] font-black text-gray-800 dark:text-gray-100 truncate">
                {userName}
              </span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium tracking-tight truncate">
                {storeName}
              </span>
            </div>
          </div>

          {/* 3. Sign Out */}
          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span
                className={`text-[11px] font-bold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${
                  expanded ? "opacity-100 max-w-[120px]" : "opacity-0 max-w-0"
                }`}
              >
                Logout
              </span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
