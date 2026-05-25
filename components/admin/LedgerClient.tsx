"use client";

import React, { useState, useMemo } from "react";
import { Search, Activity, ShieldAlert } from "lucide-react";
import LedgerToolbar from "./ledger/LedgerToolbar";
import LedgerDayGroup from "./ledger/LedgerDayGroup";

export default function LedgerClient({ transactions, products }: { transactions: any[], products: any[] }) {
  const [activeTab, setActiveTab] = useState<"ALL" | "SALES" | "STOCK">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("ALL");
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

  const toggleDay = (dateLabel: string) => {
    setOpenDays(prev => ({ ...prev, [dateLabel]: !prev[dateLabel] }));
  };

  // 1. Core Filtering Engine
  const filteredData = useMemo(() => {
    return transactions.filter((tx) => {
      // Category Isolation (The 3 Tabs)
      if (activeTab === "SALES" && tx.transaction_type !== "SALE") return false;
      if (activeTab === "STOCK" && tx.transaction_type === "SALE") return false;

      // Product Isolation (The Dropdown)
      if (selectedProduct !== "ALL" && tx.product_id !== selectedProduct) return false;

      // Smart Search String parsing
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const pName = (tx.products?.name || tx.product_name || "").toLowerCase();
        const uName = tx.users?.full_name?.toLowerCase() || "";
        const note = tx.note?.toLowerCase() || "";
        if (!pName.includes(query) && !uName.includes(query) && !note.includes(query)) return false;
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery, selectedProduct]);

  // 2. The Grouping Engine (Transforms flat data into day-by-day nested arrays)
  const groupedByDay = useMemo(() => {
    const groups: { dateLabel: string, items: any[] }[] = [];
    const map = new Map<string, any[]>();
    
    filteredData.forEach(tx => {
      const dateLabel = new Date(tx.created_at).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });
      if (!map.has(dateLabel)) {
        map.set(dateLabel, []);
        groups.push({ dateLabel, items: map.get(dateLabel)! });
      }
      map.get(dateLabel)!.push(tx);
    });

    return groups;
  }, [filteredData]);

  return (
    <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl flex flex-col transition-colors">
      <LedgerToolbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        products={products}
      />

      <div className="overflow-x-auto">
        {groupedByDay.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <ShieldAlert className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-xl font-medium text-gray-900 dark:text-white">No Stock Movements Found</p>
            <p className="text-sm mt-2">No transactions match these filters.</p>
          </div>
        ) : (
          <div className="w-full min-w-[1000px]">
            {/* Table Header Wrapper */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 dark:border-[#2C2C2E] bg-gray-50/80 dark:bg-[#252528]/80 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest sticky top-0 backdrop-blur-md z-10 transition-colors">
              <div className="col-span-1 pl-2">S/N</div>
              <div className="col-span-2">Time Recorded</div>
              <div className="col-span-3">Item & Context</div>
              <div className="col-span-1 text-right">Initial</div>
              <div className="col-span-2 text-center text-gray-700 dark:text-gray-300 font-black">DELTA ( ± )</div>
              <div className="col-span-1 text-left">New Total</div>
              <div className="col-span-2 pl-4">Staff Authorized By</div>
            </div>

            {groupedByDay.map((group) => (
              <LedgerDayGroup 
                key={group.dateLabel}
                group={group}
                isOpen={openDays[group.dateLabel] || false}
                onToggle={toggleDay}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
