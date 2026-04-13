"use client";

import { useState } from "react";
import ProductsTable from "./ProductsTable";
import InventoryValuation from "./InventoryValuation";
import { Archive, BarChart3, Settings2, Zap } from "lucide-react";
import { getPlanLimits } from "@/lib/plans";

export default function AdminProductsClient({ 
  storeSlug, 
  products,
  plan,
  isExempt
}: { 
  storeSlug: string; 
  products: any[];
  plan: string;
  isExempt?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"manage" | "valuation">("manage");
  const limits = getPlanLimits(plan);
  const usagePercentage = Math.min(100, (products.length / limits.maxProducts) * 100);
  const isNearLimit = usagePercentage >= 80;
  const isLimitReached = products.length >= limits.maxProducts;

  return (
    <div className="lg:p-8 max-w-full mx-auto space-y-6">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex p-1 bg-slate-800 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "manage"
                ? "bg-slate-700 text-blue-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Stock Management
          </button>
          <button
            onClick={() => setActiveTab("valuation")}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "valuation"
                ? "bg-slate-700 text-blue-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Inventory Valuation (BI)
          </button>
        </div>
        
        <div className="flex items-center gap-4 px-4 bg-slate-800/50 py-1.5 rounded-xl border border-slate-700">
           <div className="flex flex-col gap-1 w-24 sm:w-32">
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-slate-400">
                <span>Usage</span>
                <span>{products.length} / {limits.maxProducts === 1000000 ? '∞' : limits.maxProducts}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${isNearLimit ? 'bg-red-500' : 'bg-blue-600'}`} 
                  style={{ width: `${usagePercentage}%` }} 
                />
              </div>
           </div>
           
           <div className="hidden sm:flex items-center gap-2 text-slate-400">
              <Archive className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{products.length} Tracked</span>
           </div>

           {plan === 'free' && !isExempt && (
             <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 animate-pulse">
                <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest">Upgrade to Basic</span>
             </div>
           )}
        </div>
      </div>

      {/* Conditional Rendering based on Tab */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "manage" ? (
          <ProductsTable storeSlug={storeSlug} products={products} isLimitReached={isLimitReached} />
        ) : (
          <InventoryValuation products={products} />
        )}
      </div>
    </div>
  );
}
