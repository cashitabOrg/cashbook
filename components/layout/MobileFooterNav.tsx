"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  History,
  Users,
  FileText,
  Settings
} from "lucide-react";

const IconMap: Record<string, any> = {
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  History,
  Users,
  FileText,
  Settings
};

type NavItem = {
  name: string;
  href: string;
  icon: string;
};

interface MobileFooterNavProps {
  navItems: NavItem[];
  accentColor?: string;
}

export default function MobileFooterNav({
  navItems = [],
  accentColor = "text-blue-500"
}: MobileFooterNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-lg border-t border-slate-200 dark:border-[#2C2C2E] z-50 px-2 py-1 pb-safe">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = IconMap[item.icon] || FileText;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 transition-all duration-200 ${
                isActive ? accentColor : "text-slate-400"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-slate-100 scale-110" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-bold mt-0.5 truncate w-full text-center tracking-tighter ${
                isActive ? "opacity-100" : "opacity-70"
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
