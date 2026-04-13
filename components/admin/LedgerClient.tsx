"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, ArrowDownRight, ArrowUpRight, Activity, CalendarDays, Key, Box, ShieldAlert, User, ChevronRight, ChevronDown, PackageSearch } from "lucide-react";

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
        const pName = tx.products?.name?.toLowerCase() || "";
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      
      {/* ==================================================== */}
      {/* 1. COMPACT TOOLBAR (TABS + FILTERS)                 */}
      {/* ==================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900 border-b border-slate-800">
        
        {/* Left Aspect: The Pill-Switcher Navigation */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/60 shadow-inner">
          <button 
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-2
            ${activeTab === "ALL" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Activity className="w-3.5 h-3.5" /> 
            ALL <span className="hidden lg:inline">MOVEMENTS</span>
          </button>

          <button 
            onClick={() => setActiveTab("SALES")}
            className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-2
            ${activeTab === "SALES" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Key className="w-3.5 h-3.5" />
            SALES <span className="hidden lg:inline">STREAM</span>
          </button>

          <button 
            onClick={() => setActiveTab("STOCK")}
            className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-2
            ${activeTab === "STOCK" ? "bg-amber-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">STOCK</span> ADJUST
          </button>
        </div>

        {/* Right Aspect: Integrated Filters */}
        <div className="flex-1 flex items-center gap-3 min-w-[300px]">
          {/* Product Isolation Dropdown */}
          <div className="relative w-48 shrink-0">
            <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <select 
              value={selectedProduct} 
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-[11px] font-bold text-slate-300 outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Entire Catalog</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Deep Search Field */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search history, staff, or notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500/50 transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. THE IMMUTABLE DATA FEED (GROUPED BY DAY)          */}
      {/* ==================================================== */}
      <div className="overflow-x-auto">
        {groupedByDay.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <ShieldAlert className="w-16 h-16 text-slate-800 mb-4" />
            <p className="text-xl font-medium text-slate-400">No Stock Movements Found</p>
            <p className="text-sm mt-2">No transactions match these filters.</p>
          </div>
        ) : (
          <div className="w-full min-w-[1000px]">
            {/* Table Header Wrapper */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/50 text-xs font-bold text-slate-400 uppercase tracking-widest sticky top-0 backdrop-blur-md z-10">
              <div className="col-span-1 pl-2">S/N</div>
              <div className="col-span-2">Time Recorded</div>
              <div className="col-span-3">Item & Context</div>
              <div className="col-span-1 text-right">Initial</div>
              <div className="col-span-2 text-center text-slate-300 font-black">DELTA ( ± )</div>
              <div className="col-span-1 text-left">New Total</div>
              <div className="col-span-2 pl-4">Staff Authorized By</div>
            </div>

            {/* Daily Groups Renderer */}
            {groupedByDay.map((group) => {
              const isOpen = openDays[group.dateLabel] || false;
              
              return (
              <div key={group.dateLabel} className="animate-in fade-in duration-500 mb-1">
                {/* 📅 COLLAPSIBLE SEPARATOR */}
                <button 
                  onClick={() => toggleDay(group.dateLabel)}
                  className="w-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 px-4 py-3 flex items-center justify-between transition-colors outline-none cursor-pointer rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-5 h-5 text-blue-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                    <CalendarDays className={`w-5 h-5 ${isOpen ? 'text-blue-500' : 'text-slate-500'}`} />
                    <span className={`text-sm tracking-wide ${isOpen ? 'font-bold text-blue-100' : 'font-semibold text-slate-400'}`}>
                      {group.dateLabel}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded-md border border-slate-800/50 flex items-center justify-center">
                    {group.items.length} Entries
                  </span>
                </button>

                {/* Individual Transactions */}
                {isOpen && group.items.map((tx, idx) => {
                  const isPositive = Number(tx.quantity_change) > 0;
                  const isNegative = Number(tx.quantity_change) < 0;
                  const changeColor = isNegative ? 'text-red-400 bg-red-400/10' : (isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400');
                  const Icon = isNegative ? ArrowDownRight : ArrowUpRight;

                  return (
                    <div key={tx.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors items-center">
                      
                      {/* S/N */}
                      <div className="col-span-1 text-slate-600 font-mono text-xs pl-2 font-bold bg-slate-950/50 w-fit px-2 py-1 rounded-lg border border-slate-800/50">
                        #{idx + 1}
                      </div>

                      {/* Time */}
                      <div className="col-span-2 text-slate-400 font-mono text-sm tracking-tighter">
                        {new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      
                      {/* Product & Note Context */}
                      <div className="col-span-3 flex flex-col justify-center">
                        <span className="font-semibold text-slate-200">{tx.products?.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                             ${tx.transaction_type === 'SALE' 
                               ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                               : tx.transaction_type === 'RESTOCK'
                               ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                               : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}
                          `}>
                            {tx.transaction_type}
                          </span>
                          <span className="text-xs text-slate-500 truncate" title={tx.note}>{tx.note || "System Log"}</span>
                        </div>
                      </div>

                      {/* Initial -> [Change] -> New  */}
                      <div className="col-span-1 text-right text-slate-500 font-mono">
                        {Number(tx.quantity_before).toFixed(2)}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold tracking-tight shadow-sm ${changeColor}`}>
                          <Icon className="w-4 h-4" />
                          {Number(tx.quantity_change) > 0 ? '+' : ''}{Number(tx.quantity_change).toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1 text-left text-slate-200 font-mono font-bold">
                         {Number(tx.quantity_after).toFixed(2)}
                      </div>

                      {/* Authorization Context */}
                      <div className="col-span-2 flex items-center gap-3 pl-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                           <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-sm text-slate-400 font-medium truncate">{tx.users?.full_name || "Auto System (Offline)"}</span>
                      </div>

                    </div>
                  );
                })}
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
