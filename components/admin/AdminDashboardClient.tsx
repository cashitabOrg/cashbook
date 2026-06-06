"use client";

import { useEffect, useState, useMemo } from "react";
import { format, subDays, subMonths, subYears } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { 
  TrendingUp, 
  Package,
  Activity,
  BarChart3
} from "lucide-react";
import ExpandTableModal from "@/components/shared/ExpandTableModal";
import { getPlanLimits } from "@/lib/plans";
import DashboardHeader from "./dashboard/DashboardHeader";
import MetricsBar from "./dashboard/MetricsBar";
import PerformanceTable from "./dashboard/PerformanceTable";
import InventoryMonitorTable from "./dashboard/InventoryMonitorTable";
import AdjustmentLogTable from "./dashboard/AdjustmentLogTable";
import LedgerClient from "./LedgerClient";

type Product = {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  cost_price?: number;
  selling_price?: number;
};

type RawSession = {
  total_revenue: number;
  started_at: string;
};

type RawSaleItem = {
  product_id: string;
  quantity: number;
  subtotal: number;
  created_at: string;
  products: { name: string } | null;
};

export default function AdminDashboardClient({
  storeId,
  initialProducts,
  rawSessions,
  rawSaleItems,
  recentAdjustments,
  transactions = [],
  title,
  subtitle,
  plan = 'free',
  isExempt = false,
  staffCount = 0
}: {
  storeId: string;
  initialProducts: Product[];
  rawSessions: RawSession[];
  rawSaleItems: RawSaleItem[];
  recentAdjustments?: any[];
  transactions?: any[];
  title: string;
  subtitle: string;
  plan?: string;
  isExempt?: boolean;
  staffCount?: number;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [sessions, setSessions] = useState(rawSessions);
  const [isBestSellersOpen, setIsBestSellersOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"overview" | "ledger">("overview");

  useEffect(() => {
    if (tabParam === "ledger") {
      setActiveTab("ledger");
    } else {
      setActiveTab("overview");
    }
  }, [tabParam]);

  const handleTabChange = (newTab: "overview" | "ledger") => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", newTab);
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };
  
  // Filtering State - Default to Today (initialized on mount to avoid timezone/hydration mismatch)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate(format(new Date(), "yyyy-MM-dd"));
  }, []);

  const getActivePreset = () => {
    if (!startDate || !endDate) return "today";
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    
    if (startDate === today && endDate === today) return "today";
    if (startDate === yesterday && endDate === yesterday) return "yesterday";
    if (startDate === format(subDays(new Date(), 7), "yyyy-MM-dd") && endDate === today) return "7d";
    if (startDate === format(subMonths(new Date(), 1), "yyyy-MM-dd") && endDate === today) return "1m";
    if (startDate === format(subMonths(new Date(), 3), "yyyy-MM-dd") && endDate === today) return "3m";
    if (startDate === format(subMonths(new Date(), 6), "yyyy-MM-dd") && endDate === today) return "6m";
    if (startDate === format(subYears(new Date(), 1), "yyyy-MM-dd") && endDate === today) return "1y";
    return ""; // Custom or un-mapped range
  };

  const getDatePreset = (range: string) => {
    const today = new Date();
    switch (range) {
      case "today": return format(today, "yyyy-MM-dd");
      case "yesterday": return format(subDays(today, 1), "yyyy-MM-dd");
      case "7d": return format(subDays(today, 7), "yyyy-MM-dd");
      case "1m": return format(subMonths(today, 1), "yyyy-MM-dd");
      case "3m": return format(subMonths(today, 3), "yyyy-MM-dd");
      case "6m": return format(subMonths(today, 6), "yyyy-MM-dd");
      case "1y": return format(subYears(today, 1), "yyyy-MM-dd");
      default: return format(subDays(today, 7), "yyyy-MM-dd");
    }
  };

  const applyPreset = (range: string) => {
    const today = new Date();
    if (range === "yesterday") {
      const yesterday = subDays(today, 1);
      setStartDate(format(yesterday, "yyyy-MM-dd"));
      setEndDate(format(yesterday, "yyyy-MM-dd"));
    } else {
      setEndDate(format(today, "yyyy-MM-dd"));
      setStartDate(getDatePreset(range));
    }
  };

  // Real-time subscription to products for local cache
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-dashboard-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `store_id=eq.${storeId}` }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setProducts((prev) => prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p)));
        } else if (payload.eventType === "INSERT") {
          setProducts((prev) => [...prev, payload.new as Product]);
        } else if (payload.eventType === "DELETE") {
          setProducts((prev) => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId]);

  // Real-time subscription to sales_sessions for instant revenue updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-dashboard-sessions")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "sales_sessions",
        filter: `store_id=eq.${storeId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT" && payload.new.status === "closed") {
          // New closed session: add it to the list
          setSessions(prev => [...prev, {
            total_revenue: Number(payload.new.total_revenue || 0),
            started_at: payload.new.started_at,
          }]);
        } else if (payload.eventType === "UPDATE") {
          setSessions(prev => prev.map(s =>
            s.started_at === payload.new.started_at
              ? { ...s, total_revenue: Number(payload.new.total_revenue || 0) }
              : s
          ));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId]);

  const metrics = useMemo(() => {
    let filteredSessions = sessions;
    let filteredItems = rawSaleItems;

    // 1. Date Range Filtering
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      if (startDate) start.setHours(0, 0, 0, 0);
      
      const end = endDate ? new Date(endDate) : new Date();
      if (endDate) end.setHours(23, 59, 59, 999);

      filteredSessions = rawSessions.filter(s => {
        const d = new Date(s.started_at);
        return d >= start && d <= end;
      });

      filteredItems = rawSaleItems.filter(item => {
        const d = new Date(item.created_at);
        return d >= start && d <= end;
      });
    }

    // 2. Search Query Filtering (Performance Table)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.products?.name?.toLowerCase().includes(lowerQuery)
      );
    }

    const totalRevenue = filteredSessions.reduce((acc, curr) => acc + Number(curr.total_revenue), 0);
    
    // Aggregate Top Products
    const productStats: Record<string, { id: string, name: string, total_qty_sold: number, total_revenue: number }> = {};
    filteredItems.forEach(item => {
      const pId = item.product_id;
      const pName = item.products?.name || "Unknown";
      if (!productStats[pId]) {
        productStats[pId] = { id: pId, name: pName, total_qty_sold: 0, total_revenue: 0 };
      }
      productStats[pId].total_qty_sold += Number(item.quantity);
      productStats[pId].total_revenue += Number(item.subtotal);
    });

    const topProducts = Object.values(productStats).sort((a, b) => b.total_qty_sold - a.total_qty_sold);

    return { totalRevenue, topProducts };
  }, [startDate, endDate, rawSessions, rawSaleItems, searchQuery]);

  // Inventory Table Search Filter
  const filteredInventory = useMemo(() => {
    if (!searchQuery) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lowerQuery));
  }, [products, searchQuery]);

  // Stock Adjustment Table Search Filter
  const filteredAdjustments = useMemo(() => {
    if (!recentAdjustments) return [];
    if (!searchQuery) return recentAdjustments;
    const lowerQuery = searchQuery.toLowerCase();
    return recentAdjustments.filter(adj => 
      adj.products?.name?.toLowerCase().includes(lowerQuery) ||
      adj.reason?.toLowerCase().includes(lowerQuery) ||
      (adj.users?.full_name || "Admin").toLowerCase().includes(lowerQuery)
    );
  }, [recentAdjustments, searchQuery]);

  const lowStockCount = products.filter((p) => p.quantity < p.min_quantity).length;
  const totalStockCost = products.reduce((acc, curr) => acc + (curr.quantity * (curr.cost_price || 0)), 0);
  const totalRetailValue = products.reduce((acc, curr) => acc + (curr.quantity * (curr.selling_price || 0)), 0);
  const potentialProfit = totalRetailValue - totalStockCost;

  const limits = getPlanLimits(plan);
  const productUsagePercent = Math.min(100, (products.length / limits.maxProducts) * 100);
  const staffUsagePercent = Math.min(100, (staffCount / limits.maxStaff) * 100);

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title={title}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        applyPreset={applyPreset}
        activePreset={getActivePreset()}
      />

      {/* Premium Tab Switcher */}
      <div className="border-b border-gray-200 dark:border-[#2C2C2E] px-4 lg:px-0">
        <div className="flex gap-6 -mb-px">
          <button
            onClick={() => handleTabChange("overview")}
            className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Performance Hub
          </button>
          <button
            onClick={() => handleTabChange("ledger")}
            className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "ledger"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            Live Stock Movement
          </button>
        </div>
      </div>
      
      {activeTab === "overview" ? (
        <div className="px-2 lg:px-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <MetricsBar
            totalRevenue={metrics.totalRevenue}
            startDate={startDate}
            endDate={endDate}
            productsCount={products.length}
            lowStockCount={lowStockCount}
            totalStockCost={totalStockCost}
            totalRetailValue={totalRetailValue}
            potentialProfit={potentialProfit}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceTable 
              topProducts={metrics.topProducts}
              onExpand={() => setIsBestSellersOpen(true)}
            />
            <InventoryMonitorTable 
              filteredInventory={filteredInventory}
              onExpand={() => setIsStockOpen(true)}
            />
          </div>

           <AdjustmentLogTable recentAdjustments={filteredAdjustments} />
        </div>
      ) : (
        <div className="px-2 lg:px-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <LedgerClient transactions={transactions} products={products} storeId={storeId} />
        </div>
      )}

      {/* Expand Modals */}
      <ExpandTableModal
        isOpen={isBestSellersOpen}
        onClose={() => setIsBestSellersOpen(false)}
        title="Performance Index"
        subtitle="Full sales breakdown for selected date range"
        icon={<TrendingUp className="w-4 h-4" />}
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2C2C2E]">
          <thead className="bg-gray-50 dark:bg-[#252528] sticky top-0 z-10 font-bold uppercase tracking-wider text-[10px] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-[#2C2C2E]">
            <tr>
              <th className="py-4 px-8 text-left w-12">SN</th>
              <th className="py-4 px-8 text-left">Product Name</th>
              <th className="py-4 px-8 text-right">Units Sold</th>
              <th className="py-4 px-8 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-gray-200 dark:divide-[#2C2C2E]">
            {metrics.topProducts.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-sm text-gray-500 dark:text-gray-400 italic bg-white dark:bg-[#1C1C1E]">No sales data available.</td></tr>
            ) : (
              metrics.topProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#252528]/50 transition-colors">
                  <td className="py-4 px-8 text-xs text-gray-500 dark:text-gray-400 font-mono italic">{idx + 1}</td>
                  <td className="py-4 px-8 text-sm font-bold text-gray-900 dark:text-gray-100">{p.name}</td>
                  <td className="py-4 px-8 text-sm text-gray-500 dark:text-gray-400 text-right font-mono">{p.total_qty_sold.toFixed(2)}</td>
                  <td className="py-4 px-8 text-sm text-emerald-600 dark:text-emerald-500 font-bold text-right">₦{Number(p.total_revenue).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ExpandTableModal>

      <ExpandTableModal
        isOpen={isStockOpen}
        onClose={() => setIsStockOpen(false)}
        title="Inventory Monitor"
        subtitle="Full stock levels for all products"
        icon={<Package className="w-4 h-4" />}
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2C2C2E]">
          <thead className="bg-gray-50 dark:bg-[#252528] sticky top-0 z-10 font-bold uppercase tracking-wider text-[10px] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-[#2C2C2E]">
            <tr>
              <th className="py-4 px-8 text-left w-12">SN</th>
              <th className="py-4 px-8 text-left">Product</th>
              <th className="py-4 px-8 text-right">Stock</th>
              <th className="py-4 px-8 text-center">Health</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-gray-200 dark:divide-[#2C2C2E]">
            {filteredInventory.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-sm text-gray-500 dark:text-gray-400 italic bg-white dark:bg-[#1C1C1E]">No products found.</td></tr>
            ) : (
              filteredInventory.map((p, idx) => {
                const isLow = p.quantity < p.min_quantity;
                return (
                  <tr key={p.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-[#252528]/50 ${isLow ? 'bg-red-500/5 dark:bg-red-500/10' : ''}`}>
                    <td className="py-4 px-8 text-xs text-gray-500 dark:text-gray-400 font-mono italic">{idx + 1}</td>
                    <td className="py-4 px-8 text-sm font-bold text-gray-900 dark:text-gray-100">{p.name}</td>
                    <td className="py-4 px-8 text-sm text-right">
                      <span className={`font-mono font-bold ${isLow ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-200'}`}>{p.quantity.toFixed(2)}</span>
                      <span className="text-gray-400 text-[10px] ml-1 uppercase">{p.unit}</span>
                    </td>
                    <td className="py-4 px-8 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-[10px] font-bold text-red-500 dark:text-red-400 uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>Urgent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Healthy</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ExpandTableModal>
    </div>
  );
}
