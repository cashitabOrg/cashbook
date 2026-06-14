"use client";

import { useEffect, useState, useMemo } from "react";
import { format, subDays, subMonths, subYears } from "date-fns";
import { toLagosDateString } from "@/lib/date-utils";
import { 
  TrendingUp, 
  Package
} from "lucide-react";
import ExpandTableModal from "@/components/shared/ExpandTableModal";
import ManagerDashboardHeader from "./dashboard/ManagerDashboardHeader";
import ManagerSummaryCards from "./dashboard/ManagerSummaryCards";
import ManagerBestSellers from "./dashboard/ManagerBestSellers";
import ManagerStockLevels from "./dashboard/ManagerStockLevels";
import { formatCurrency } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
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

export default function ManagerDashboardClient({
  storeId,
  initialProducts,
  rawSessions,
  rawSaleItems,
  title,
  subtitle,
}: {
  storeId: string;
  initialProducts: Product[];
  rawSessions: RawSession[];
  rawSaleItems: RawSaleItem[];
  title: string;
  subtitle: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [sessions, setSessions] = useState(rawSessions);
  const [isBestSellersOpen, setIsBestSellersOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);

  // Filtering State - Default to Last 7 Days in Lagos Timezone
  const [startDate, setStartDate] = useState(() => {
    const todayLagos = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos' }).format(new Date()));
    return format(subDays(todayLagos, 7), "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => toLagosDateString(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreset, setActivePreset] = useState("7d");

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
    setActivePreset(range);
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
    setSessions(rawSessions);
  }, [rawSessions]);

  // Dynamic Metrics Calculation
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

    // 2. Search Query Filtering (Best Sellers Table)
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

  const lowStockCount = products.filter((p) => p.quantity < p.min_quantity).length;

  return (
    <div className="space-y-6">
      <ManagerDashboardHeader 
        title={title}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        applyPreset={applyPreset}
        activePreset={activePreset}
      />
      
      <div className="px-2 lg:px-0 space-y-6">
        <ManagerSummaryCards 
          totalRevenue={metrics.totalRevenue}
          productsCount={products.length}
          lowStockCount={lowStockCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 lg:pb-0">
          <ManagerBestSellers 
            topProducts={metrics.topProducts}
            onExpand={() => setIsBestSellersOpen(true)}
          />
          <ManagerStockLevels 
            filteredInventory={filteredInventory}
            onExpand={() => setIsStockOpen(true)}
          />
        </div>
      </div>

      {/* Expand Modals */}
      <ExpandTableModal
        isOpen={isBestSellersOpen}
        onClose={() => setIsBestSellersOpen(false)}
        title="Best Sellers"
        subtitle="Full sales breakdown for selected date range"
        icon={<TrendingUp className="w-4 h-4" />}
      >
        <table className="min-w-full divide-y divide-slate-100 dark:divide-[#2C2C2E]">
          <thead className="bg-slate-50/80 dark:bg-[#252528]/80 sticky top-0 z-10 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
            <tr>
              <th className="py-4 px-8 text-left w-12">SN</th>
              <th className="py-4 px-8 text-left">Item Name</th>
              <th className="py-4 px-8 text-right">Sold</th>
              <th className="py-4 px-8 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-slate-100 dark:divide-[#2C2C2E]">
            {metrics.topProducts.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-sm text-slate-400 dark:text-gray-500 italic">No sales data available.</td></tr>
            ) : (
              metrics.topProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-[#252528]/50 transition-colors">
                  <td className="py-4 px-8 text-xs text-slate-400 dark:text-gray-500 font-mono italic">{idx + 1}</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-900 dark:text-white">{p.name}</td>
                  <td className="py-4 px-8 text-sm text-slate-600 dark:text-gray-300 text-right font-mono">{p.total_qty_sold.toFixed(2)}</td>
                  <td className="py-4 px-8 text-sm text-emerald-600 dark:text-emerald-400 font-bold text-right">{formatCurrency(Number(p.total_revenue))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ExpandTableModal>

      <ExpandTableModal
        isOpen={isStockOpen}
        onClose={() => setIsStockOpen(false)}
        title="Stock Levels"
        subtitle="Full inventory status for all products"
        icon={<Package className="w-4 h-4" />}
      >
        <table className="min-w-full divide-y divide-slate-100 dark:divide-[#2C2C2E]">
          <thead className="bg-slate-50/80 dark:bg-[#252528]/80 sticky top-0 z-10 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
            <tr>
              <th className="py-4 px-8 text-left w-12">SN</th>
              <th className="py-4 px-8 text-left">Item</th>
              <th className="py-4 px-8 text-right">Count</th>
              <th className="py-4 px-8 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-slate-100 dark:divide-[#2C2C2E]">
            {filteredInventory.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-sm text-slate-400 dark:text-gray-500 italic">No products found.</td></tr>
            ) : (
              filteredInventory.map((p, idx) => {
                const isLow = p.quantity < p.min_quantity;
                return (
                  <tr key={p.id} className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-[#252528]/50 ${isLow ? 'bg-red-50/30 dark:bg-red-500/10' : ''}`}>
                    <td className="py-4 px-8 text-xs text-slate-400 dark:text-gray-500 font-mono italic">{idx + 1}</td>
                    <td className="py-4 px-8 text-sm font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-4 px-8 text-sm text-right">
                      <span className={`font-mono font-bold ${isLow ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-gray-300'}`}>{p.quantity.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-8 text-center">
                      {isLow ? (
                        <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-3 py-1 rounded-full uppercase tracking-tighter italic">Low Stock</span>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full uppercase tracking-tighter">In Stock</span>
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
