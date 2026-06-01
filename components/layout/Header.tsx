"use client";

import { Moon, Search, Sun } from "lucide-react";
import { useTheme } from "@teispace/next-themes";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

interface HeaderProps {
  userName?: string;
}

export default function Header({ userName = "Admin" }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const paths = pathname.split("/").filter(Boolean);

  useEffect(() => setMounted(true), []);

  // Basic breadcrumb generation for demo purposes based on URL
  const breadcrumbs = paths.slice(-2).map((p) => p.replace(/-/g, " "));
  if (breadcrumbs.length === 0) breadcrumbs.push("Dashboard");

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 px-6 gap-4">
      <div className="flex flex-col">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span className="truncate max-w-[120px]">{crumb}</span>
              {idx < breadcrumbs.length - 1 && (
                <span className="mx-2">&gt;</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6 w-full md:w-auto justify-end">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search for reports, equipments"
            className="w-full bg-gray-100 dark:bg-[#1C1C1E] border border-transparent dark:border-[#2C2C2E] rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-gray-100"
            disabled
          />
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>

        {mounted && (
          <button
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#2C2C2E] transition-colors"
            title="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-5 h-5 text-gray-400 hover:text-amber-400 transition-colors" />
            ) : (
              <Moon className="w-5 h-5 text-gray-500 hover:text-blue-500 transition-colors" />
            )}
          </button>
        )}

        <div className="flex items-center gap-3 shrink-0 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
            {userName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
