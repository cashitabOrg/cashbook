"use client";

import { useEffect, useState, useMemo } from "react";
import { subDays, subMonths, subYears } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { toLagosDateString } from "@/lib/date-utils";
import { fetchDashboardSaleItemsByRange, fetchDashboardSessionsByRange } from "@/app/actions/dashboard";
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
import AdjustmentLogTable, { Adjustment } from "./dashboard/AdjustmentLogTable";
import LedgerClient from "./LedgerClient";
import { formatCurrency } from "@/lib/format";

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
  title,
  subtitle,
  plan = 'free',
  isExempt = false,
  staffCount = 0,
  initialStartDate = "",
  initialEndDate = ""
}: {
  storeId: string;
  initialProducts: Product[];
  rawSessions: RawSession[];
  rawSaleItems: RawSaleItem[];
  recentAdjustments?: Adjustment[];
  title: string;
  subtitle: string;
  plan?: string;
  isExempt?: boolean;
  staffCount?: number;
  initialStartDate?: string;
  initialEndDate?: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [saleItems, setSaleItems] = useState(rawSaleItems);
  const [fetchedSessions, setFetchedSessions] = useState(rawSessions);
  const [dataLoading, setDataLoading] = useState(false);
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
  
  // Filtering State - Default to Today (pre-loaded with server values to prevent layout shift)
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const todayLagos = toLagosDateString(new Date());
    setStartDate(todayLagos);
    setEndDate(todayLagos);
  }, []);

  const getActivePreset = () => {
    if (!startDate || !endDate) return "today";
    const todayLagos = toLagosDateString(new Date());
    const todayLagosDate = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos' }).format(new Date()));
    const yesterdayLagos = toLagosDateString(subDays(todayLagosDate, 1));
    
    if (startDate === todayLagos && endDate === todayLagos) return "today";
    if (startDate === yesterdayLagos && endDate === yesterdayLagos) return "yesterday";
    if (startDate === toLagosDateString(subDays(todayLagosDate, 7)) && endDate === todayLagos) return "7d";
    if (startDate === toLagosDateString(subMonths(todayLagosDate, 1)) && endDate === todayLagos) return "1m";
    if (startDate === toLagosDateString(subMonths(todayLagosDate, 3)) && endDate === todayLagos) return "3m";
    if (startDate === toLagosDateString(subMonths(todayLagosDate, 6)) && endDate === todayLagos) return "6m";
    if (startDate === toLagosDateString(subYears(todayLagosDate, 1)) && endDate === todayLagos) return "1y";
    return ""; // Custom or un-mapped range
  };

  const getDatePreset = (range: string) => {
    const todayLagosDate = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos' }).format(new Date()));
    switch (range) {
      case "today": return toLagosDateString(todayLagosDate);
      case "yesterday": return toLagosDateString(subDays(todayLagosDate, 1));
      case "7d": return toLagosDateString(subDays(todayLagosDate, 7));
      case "1m": return toLagosDateString(subMonths(todayLagosDate, 1));
      case "3m": return toLagosDateString(subMonths(todayLagosDate, 3));
      case "6m": return toLagosDateString(subMonths(todayLagosDate, 6));
      case "1y": return toLagosDateString(subYears(todayLagosDate, 1));
      default: return toLagosDateString(subDays(todayLagosDate, 7));
    }
  };

  const applyPreset = (range: string) => {
    const todayLagosDate = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos' }).format(new Date()));
    const todayLagosStr = toLagosDateString(todayLagosDate);
    if (range === "yesterday") {
      const yesterdayStr = toLagosDateString(subDays(todayLagosDate, 1));
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
    } else {
      setEndDate(todayLagosStr);
      setStartDate(getDatePreset(range));
    }
  };

  // Synchronize state with fresh server props when Next.js refreshes in the background
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setSaleItems(rawSaleItems);
  }, [rawSaleItems]);

  useEffect(() => {
    setFetchedSessions(rawSessions);
  }, [rawSessions]);

  // Fetch fresh data whenever date range changes (debounced)
  useEffect(() => {
    if (!startDate || !endDate) return;
    let cancelled = false;
    setDataLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [items, sess] = await Promise.all([
          fetchDashboardSaleItemsByRange(storeId, startDate, endDate),
          fetchDashboardSessionsByRange(storeId, startDate, endDate),
        ]);
        if (!cancelled) {
          setSaleItems(items);
          setFetchedSessions(sess);
        }
      } catch (err) {
        console.error('[AdminDashboard] range fetch error:', err);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [startDate, endDate, storeId]);

  const metrics = useMemo(() => {
    // Filter sessions and items within the selected date range
    const filteredSessions = fetchedSessions;
    let filteredItems = saleItems;

    // Search Query Filtering (Performance Table)
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
  }, [fetchedSessions, saleItems, searchQuery]);

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
      <div className="border-b border-gray-200 dark:border-[#2C2C2E] px-2 lg:px-0">
        <div className="flex justify-center gap-8 sm:gap-16 -mb-px overflow-x-auto scrollbar-thin">
          <button
            onClick={() => handleTabChange("overview")}
            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
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
            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
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
              isLoading={dataLoading}
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
          <LedgerClient 
            storeId={storeId} 
            searchQuery={searchQuery}
          />
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
                  <td className="py-4 px-8 text-sm text-emerald-600 dark:text-emerald-500 font-bold text-right">{formatCurrency(Number(p.total_revenue))}</td>
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
