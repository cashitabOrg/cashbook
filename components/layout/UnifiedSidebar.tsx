"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LogOut, 
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  History,
  Users,
  FileText,
  Activity,
  CreditCard
} from "lucide-react";

const IconMap: Record<string, any> = {
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  History,
  Users,
  FileText,
  Activity,
  CreditCard
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
  navItems,
  signOutAction,
}: UnifiedSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-24 shrink-0 hidden md:block relative z-50">
      <div className="absolute top-0 left-0 h-full w-24 hover:w-44 transition-all duration-300 bg-gray-50 dark:bg-[#111111] border-r border-gray-200 dark:border-[#2C2C2E] flex flex-col overflow-x-hidden overflow-y-auto shadow-none hover:shadow-2xl group">
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-transparent shrink-0 mt-4">
        <div className="flex flex-col items-center">
          <img src="/Logo_cashitab.png" alt="Logo" className="w-12 h-12 object-contain" />
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-6 flex flex-col gap-4 px-2 items-center">
        {navItems.map((item) => {
          const Icon = IconMap[item.icon] || FileText;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-3 rounded-2xl transition-all group ${
                isActive 
                  ? "text-gray-900 dark:text-white" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <div className={`p-2.5 rounded-xl mb-1.5 transition-all ${
                isActive ? "bg-[#0052FF] text-white shadow-lg shadow-[#0052FF]/20" : "group-hover:bg-gray-200 dark:group-hover:bg-[#2C2C2E]"
              }`}>
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-center px-1 truncate w-full">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer / SignOut */}
      <div className="p-4 mt-auto">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex flex-col items-center justify-center w-full py-3 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5 mb-1.5 shrink-0" />
            <span className="text-[10px] font-semibold tracking-wider">Logout</span>
          </button>
        </form>
      </div>
      </div>
    </aside>
  );
}
