"use client";

import { useState } from "react";
import ProductsTable from "./ProductsTable";
import InventoryValuation from "./InventoryValuation";
import { Archive, BarChart3, Settings2 } from "lucide-react";

export default function AdminProductsClient({ 
  storeSlug, 
  products 
}: { 
  storeSlug: string; 
  products: any[] 
}) {
  const [activeTab, setActiveTab] = useState<"manage" | "valuation">("manage");

  return (
    <div className="lg:p-8 max-w-full mx-auto space-y-6">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "manage"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Stock Management
          </button>
          <button
            onClick={() => setActiveTab("valuation")}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "valuation"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Inventory Valuation (BI)
          </button>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 px-4 text-slate-400">
           <Archive className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-widest">{products.length} Products Tracked</span>
        </div>
      </div>

      {/* Conditional Rendering based on Tab */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "manage" ? (
          <ProductsTable storeSlug={storeSlug} products={products} />
        ) : (
          <InventoryValuation products={products} />
        )}
      </div>
    </div>
  );
}
