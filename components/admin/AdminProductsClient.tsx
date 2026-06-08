"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductsTable from "./ProductsTable";
import InventoryValuation from "./InventoryValuation";
import { Archive, BarChart3, Settings2, Zap, Search, Plus, AlertTriangle } from "lucide-react";
import { getPlanLimits } from "@/lib/plans";
import ProductModal from "./ProductModal";

export default function AdminProductsClient({ 
  storeId,
  storeName,
  storeSlug, 
  products,
  plan,
  isExempt = false
}: { 
  storeId: string;
  storeName: string;
  storeSlug: string; 
  products: any[];
  plan: string;
  isExempt?: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"manage" | "valuation">("manage");
  const [searchQuery, setSearchQuery] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Normalize plan name
  let activePlan = plan.toLowerCase();
  if (activePlan === 'basic') activePlan = 'growth';
  if (activePlan === 'pro') activePlan = 'business';

  const limits = getPlanLimits(activePlan);

  useEffect(() => {
    if (tabParam === "valuation") {
      setActiveTab("valuation");
    } else {
      setActiveTab("manage");
    }
  }, [tabParam]);

  const handleTabChange = (newTab: "manage" | "valuation") => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", newTab);
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lower = searchQuery.toLowerCase();
    return products.filter(p => p.name?.toLowerCase().includes(lower));
  }, [products, searchQuery]);

  const usagePercentage = Math.min(100, (products.length / limits.maxProducts) * 100);
  const isNearLimit = usagePercentage >= 80;
  const isLimitReached = products.length >= limits.maxProducts;

  return (
    <div className="lg:p-8 max-w-full mx-auto space-y-6">
      {/* Unified Header */}
      <div className="bg-white dark:bg-[#1C1C1E] lg:border border-gray-200 dark:border-[#2C2C2E] lg:rounded-2xl px-4 lg:px-6 py-3.5 shadow-sm relative overflow-hidden mb-2 flex flex-row items-center justify-between gap-2 sm:gap-4 transition-colors">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Unified Search Box */}
        <div className="relative z-20 flex-1 min-w-0 max-w-xs md:max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 focus:ring-blue-400 transition-all outline-none font-medium"
          />
        </div>

        {/* Simple Usage Label */}
        <div className="relative z-20 flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 shrink-0 select-none">
          <span className="hidden sm:inline">Usage:</span>
          <span className="text-gray-900 dark:text-white font-mono font-bold">{products.length}/{limits.maxProducts === 1000000 ? '∞' : limits.maxProducts}</span>
        </div>
        
        {activeTab === "manage" && (
          <button
            type="button"
            onClick={() => setProductModalOpen(true)}
            disabled={isLimitReached}
            className={`relative z-20 inline-flex items-center rounded-xl px-4 py-2 text-[10px] font-black shadow-sm transition-all active:scale-95 gap-2 uppercase tracking-widest shrink-0 ${
              isLimitReached 
                ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed grayscale" 
                : "bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            }`}
          >
            {isLimitReached ? <AlertTriangle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span className="hidden sm:inline">{isLimitReached ? "Limit Reached" : "Add Product"}</span>
          </button>
        )}
      </div>

      {/* Premium Tab Switcher */}
      <div className="border-b border-gray-200 dark:border-[#2C2C2E] px-2 lg:px-0">
        <div className="flex justify-center gap-8 sm:gap-16 -mb-px overflow-x-auto scrollbar-thin">
          <button
            onClick={() => handleTabChange("manage")}
            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "manage"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Inventory Grid
          </button>

          <button
            onClick={() => handleTabChange("valuation")}
            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "valuation"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Intelligence BI
          </button>
        </div>
      </div>

      {/* Conditional Rendering based on Tab */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "manage" ? (
          <ProductsTable storeSlug={storeSlug} products={filteredProducts} isLimitReached={isLimitReached} />
        ) : (
          <InventoryValuation products={filteredProducts} />
        )}
      </div>

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        storeSlug={storeSlug}
        product={null}
      />
    </div>
  );
}
