"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductsTable from "./ProductsTable";
import InventoryValuation from "./InventoryValuation";
import ReportsClient from "./ReportsClient";
import { Archive, BarChart3, Settings2, Zap, FileText } from "lucide-react";
import { getPlanLimits } from "@/lib/plans";

export default function AdminProductsClient({ 
  storeId,
  storeName,
  storeSlug, 
  products,
  salesData,
  plan,
  isExempt = false
}: { 
  storeId: string;
  storeName: string;
  storeSlug: string; 
  products: any[];
  salesData: any[];
  plan: string;
  isExempt?: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"manage" | "reports" | "valuation">("manage");

  // Normalize plan name
  let activePlan = plan.toLowerCase();
  if (activePlan === 'basic') activePlan = 'growth';
  if (activePlan === 'pro') activePlan = 'business';

  const limits = getPlanLimits(activePlan);
  const canExportReports = limits.features.exportReports;

  useEffect(() => {
    if (tabParam === "reports" && canExportReports) {
      setActiveTab("reports");
    } else if (tabParam === "valuation") {
      setActiveTab("valuation");
    } else {
      setActiveTab("manage");
    }
  }, [tabParam, canExportReports]);

  const handleTabChange = (newTab: "manage" | "reports" | "valuation") => {
    if (newTab === "reports" && !canExportReports) return;
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", newTab);
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  const usagePercentage = Math.min(100, (products.length / limits.maxProducts) * 100);
  const isNearLimit = usagePercentage >= 80;
  const isLimitReached = products.length >= limits.maxProducts;

  return (
    <div className="lg:p-8 max-w-full mx-auto space-y-6">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1C1C1E] p-2 rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm dark:shadow-2xl transition-colors">
        <div className="flex p-1 bg-gray-50 dark:bg-[#252528] rounded-xl gap-1">
          <button
            onClick={() => handleTabChange("manage")}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "manage"
                ? "bg-white dark:bg-[#3A3A3C] text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3A3C]/50"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Inventory Grid
          </button>
          
          {canExportReports && (
            <button
              onClick={() => handleTabChange("reports")}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === "reports"
                  ? "bg-white dark:bg-[#3A3A3C] text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3A3C]/50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Daily Sales Reports
            </button>
          )}

          <button
            onClick={() => handleTabChange("valuation")}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "valuation"
                ? "bg-white dark:bg-[#3A3A3C] text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3A3C]/50"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Intelligence BI
          </button>
        </div>
        
        <div className="flex items-center gap-4 px-4 bg-gray-50 dark:bg-[#252528]/50 py-1.5 rounded-xl border border-gray-200 dark:border-[#3A3A3C]/50 transition-colors">
           <div className="flex flex-col gap-1 w-24 sm:w-32">
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-gray-500 dark:text-gray-400">
                <span>Usage</span>
                <span>{products.length} / {limits.maxProducts === 1000000 ? '∞' : limits.maxProducts}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${isNearLimit ? 'bg-red-500' : 'bg-blue-600'}`} 
                  style={{ width: `${usagePercentage}%` }} 
                />
              </div>
           </div>
           
           <div className="hidden sm:flex items-center gap-2 text-gray-500 dark:text-gray-400">
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
        ) : activeTab === "reports" ? (
          <ReportsClient 
            storeId={storeId}
            storeName={storeName}
            plan={plan}
            isBillingExempt={isExempt}
            salesData={salesData}
          />
        ) : (
          <InventoryValuation products={products} />
        )}
      </div>
    </div>
  );
}
