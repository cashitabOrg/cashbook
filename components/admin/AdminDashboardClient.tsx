"use client";

import { useEffect, useState, useMemo } from "react";
import { format, subDays, subMonths, subYears } from "date-fns";
import { createClient } from "@/lib/supabase";
import { 
  AlertCircle, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Filter, 
  RefreshCcw, 
  Search, 
  RotateCcw,
  ChevronDown,
  Maximize2
} from "lucide-react";
import ExpandTableModal from "@/components/shared/ExpandTableModal";

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
}: {
  storeId: string;
  initialProducts: Product[];
  rawSessions: RawSession[];
  rawSaleItems: RawSaleItem[];
  recentAdjustments?: any[];
  title: string;
  subtitle: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [isBestSellersOpen, setIsBestSellersOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  
  // Filtering State - Default to Last 7 Days
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");

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

  // Dynamic Metrics Calculation
  const metrics = useMemo(() => {
    let filteredSessions = rawSessions;
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

  const lowStockCount = products.filter((p) => p.quantity < p.min_quantity).length;
  const totalStockCost = products.reduce((acc, curr) => acc + (curr.quantity * (curr.cost_price || 0)), 0);
  const totalRetailValue = products.reduce((acc, curr) => acc + (curr.quantity * (curr.selling_price || 0)), 0);
  const potentialProfit = totalRetailValue - totalStockCost;

  return (
    <div className="space-y-6">
      {/* Ultra-Compact Unified Header */}
      <div className="bg-slate-900 lg:border border-slate-800 lg:rounded-2xl px-4 lg:px-6 py-4 shadow-2xl relative overflow-hidden mb-2">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-row flex-wrap xl:flex-nowrap items-center justify-between gap-4">
          {/* Section 1: Title & Search (Now Combined) */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h1 className="text-sm lg:text-lg font-black text-white tracking-tight leading-none whitespace-nowrap shrink-0">{title}</h1>
            
            <div className="relative flex-1 max-w-[200px] group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-white placeholder:text-slate-400 focus:bg-slate-700 focus:ring-1 focus:ring-blue-400 transition-all outline-none"
              />
            </div>
          </div>

          {/* Section 2: Consolidated Controls Row */}
          <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
            {/* Range Dropdown */}
            <div className="relative shrink-0">
               <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-400 pointer-events-none" />
               <select
                 onChange={(e) => applyPreset(e.target.value)}
                 className="bg-slate-800 border border-slate-700 text-white text-[10px] font-bold rounded-xl pl-8 pr-8 py-1.5 outline-none appearance-none cursor-pointer focus:bg-slate-700 transition-all"
               >
                 <option value="7d">Last 7 Days</option>
                 <option value="today">Today</option>
                 <option value="yesterday">Yesterday</option>
                 <option value="1m">Last Month</option>
                 <option value="3m">3 Months</option>
                 <option value="6m">6 Months</option>
                 <option value="1y">1 Year</option>
               </select>
               <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
            </div>

            {/* Compact Dates */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-xl px-2 py-1 shrink-0">
               <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[10px] text-white font-bold outline-none w-[90px] [color-scheme:dark]" />
               <span className="text-slate-600 font-bold">-</span>
               <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[10px] text-white font-bold outline-none w-[90px] [color-scheme:dark]" />
            </div>

            <button onClick={() => { applyPreset("7d"); setSearchQuery(""); }} className="p-1.5 text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700 shrink-0" title="Reset">
               <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="px-2 lg:px-0 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-5">
          <div className="bg-white overflow-hidden lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 shadow-sm col-span-2">
            <div className="p-3 lg:p-6">
              <div className="flex items-center lg:gap-5">
                <div className="flex-shrink-0 bg-blue-50 rounded-xl p-2 lg:p-4">
                  <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
                </div>
                <div className="ml-3 lg:ml-0">
                  <p className="text-[8px] lg:text-sm font-semibold text-slate-500 uppercase tracking-wider">Revenue ({startDate === endDate ? 'Today' : 'Range'})</p>
                  <div className="text-xs lg:text-3xl font-black text-slate-900 leading-none mt-1">₦{metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 shadow-sm">
            <div className="p-3 lg:p-6">
              <div className="flex items-center lg:gap-5">
                <div className="flex-shrink-0 bg-emerald-50 rounded-xl p-2 lg:p-4">
                  <Package className="h-4 w-4 lg:h-6 lg:w-6 text-emerald-600" />
                </div>
                <div className="ml-3 lg:ml-0">
                  <p className="text-[8px] lg:text-sm font-semibold text-slate-500 uppercase tracking-wider">Products</p>
                  <div className="text-xs lg:text-3xl font-black text-slate-900 leading-none mt-1">{products.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 shadow-sm">
            <div className="p-3 lg:p-6">
              <div className="flex items-center lg:gap-5">
                <div className="flex-shrink-0 bg-red-50 rounded-xl p-2 lg:p-4">
                  <AlertCircle className="h-4 w-4 lg:h-6 lg:w-6 text-red-600" />
                </div>
                <div className="ml-3 lg:ml-0">
                  <p className="text-[8px] lg:text-sm font-semibold text-slate-500 uppercase tracking-wider">Low Stock</p>
                  <div className="text-xs lg:text-3xl font-black text-slate-900 leading-none mt-1">{lowStockCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products by Sales */}
          <div className="bg-white lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 overflow-hidden flex flex-col h-[450px]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Performance Index</h3>
                <p className="text-sm text-slate-500">Sales breakdown for selected range.</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <button
                  onClick={() => setIsBestSellersOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Expand table"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10 font-bold uppercase tracking-wider text-[10px] text-slate-500">
                  <tr>
                    <th className="py-3 px-6 text-left w-12">SN</th>
                    <th className="py-3 px-6 text-left">Product Name</th>
                    <th className="py-3 px-6 text-right">Units Sold</th>
                    <th className="py-3 px-6 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {metrics.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-sm text-slate-500 font-medium italic">No sales found matching search/dates.</td>
                    </tr>
                  ) : (
                    metrics.topProducts.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 text-[10px] text-slate-400 font-mono italic">{idx + 1}</td>
                        <td className="py-4 px-6 text-sm font-bold text-slate-900">{p.name}</td>
                        <td className="py-4 px-6 text-sm text-slate-600 text-right font-mono">{p.total_qty_sold.toFixed(2)}</td>
                        <td className="py-4 px-6 text-sm text-emerald-600 font-bold text-right">₦{Number(p.total_revenue).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Realtime Stock Status */}
          <div className="bg-white lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 overflow-hidden flex flex-col h-[450px]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Inventory Monitor</h3>
                <span className="text-xs font-bold text-slate-400">Live Status</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-tighter">Live</span>
                <button
                  onClick={() => setIsStockOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Expand table"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10 font-bold uppercase tracking-wider text-[10px] text-slate-500">
                  <tr>
                    <th className="py-3 px-6 text-left w-12">SN</th>
                    <th className="py-3 px-6 text-left">Product</th>
                    <th className="py-3 px-6 text-right">Stock</th>
                    <th className="py-3 px-6 text-center">Health</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-sm text-slate-500 font-medium italic">No products found matching search.</td>
                    </tr>
                  ) : (
                    filteredInventory.map((p, idx) => {
                      const isLow = p.quantity < p.min_quantity;
                      return (
                        <tr key={p.id} className={`transition-colors hover:bg-slate-50 ${isLow ? 'bg-red-50/30' : ''}`}>
                          <td className="py-4 px-6 text-[10px] text-slate-400 font-mono italic">{idx + 1}</td>
                          <td className="py-4 px-6 text-sm font-bold text-slate-900">{p.name}</td>
                          <td className="py-4 px-6 text-sm text-right">
                            <span className={`font-mono font-bold ${isLow ? 'text-red-600' : 'text-slate-600'}`}>{p.quantity.toFixed(2)}</span>
                            <span className="text-slate-400 text-[10px] ml-1 uppercase">{p.unit}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-[10px] font-bold text-red-700 uppercase">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                  Urgent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700 uppercase">
                                  Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Stock Adjustment Log Section */}
        <div className="bg-white lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Stock Adjustment Log</h3>
              <p className="text-sm text-slate-500">Most recent inventory corrections and spoilage logs.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-100 italic">Adjustment Archive</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-[10px] text-slate-500">
                <tr>
                  <th className="py-3 px-6 text-left w-12">SN</th>
                  <th className="py-3 px-6 text-left">Time</th>
                  <th className="py-3 px-6 text-left">Product</th>
                  <th className="py-3 px-6 text-right">Adjustment</th>
                  <th className="py-3 px-6 text-left pl-6">Reason</th>
                  <th className="py-3 px-6 text-left pl-6">Admin</th>
                  <th className="py-3 px-6 text-left pr-6">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {!recentAdjustments || recentAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-500 font-medium italic">No recent adjustments found.</td>
                  </tr>
                ) : (
                  recentAdjustments.map((adj, idx) => (
                    <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-[10px] text-slate-400 font-mono italic">{idx + 1}</td>
                      <td className="py-4 px-6 text-xs text-slate-500">{format(new Date(adj.created_at), "MMM d, HH:mm")}</td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">{adj.products?.name}</td>
                      <td className={`py-4 px-6 text-sm font-black text-right ${adj.quantity_change < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {adj.quantity_change < 0 ? '-' : '+'}{Math.abs(adj.quantity_change).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-xs font-bold pl-6">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md uppercase tracking-tighter border border-slate-200 shadow-sm">{adj.reason}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-700 pl-6 font-medium">{adj.users?.full_name || "Admin"}</td>
                      <td className="py-4 px-6 text-[11px] text-slate-400 italic pr-6 truncate max-w-[200px]">{adj.note || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Valuation Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-5">
          <div className="bg-white lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 shadow-sm p-3 lg:p-6 flex items-center gap-4">
            <div className="bg-amber-50 p-2 lg:p-3 rounded-xl text-amber-600">
               <TrendingUp className="w-4 h-4 lg:w-6 lg:h-6" />
            </div>
            <div>
              <p className="text-[8px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">Stock Cost</p>
              <p className="text-xs lg:text-xl font-black text-slate-900">₦{totalStockCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
            </div>
          </div>
          
          <div className="bg-white lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 shadow-sm p-3 lg:p-6 flex items-center gap-4">
            <div className="bg-blue-50 p-2 lg:p-3 rounded-xl text-blue-600">
               <Package className="w-4 h-4 lg:w-6 lg:h-6" />
            </div>
            <div>
              <p className="text-[8px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">Retail Value</p>
              <p className="text-xs lg:text-xl font-black text-slate-900">₦{totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
            </div>
          </div>

          <div className="bg-white lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 shadow-sm p-3 lg:p-6 flex items-center gap-4 col-span-2 lg:col-span-1">
            <div className="bg-emerald-50 p-2 lg:p-3 rounded-xl text-emerald-600">
               <DollarSign className="w-4 h-4 lg:w-6 lg:h-6" />
            </div>
            <div>
              <p className="text-[8px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">Est. Profit Margin</p>
              <p className="text-xs lg:text-xl font-black text-emerald-600">₦{potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expand Modals */}
      <ExpandTableModal
        isOpen={isBestSellersOpen}
        onClose={() => setIsBestSellersOpen(false)}
        title="Performance Index"
        subtitle="Full sales breakdown for selected date range"
        icon={<TrendingUp className="w-4 h-4" />}
      >
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10 font-bold uppercase tracking-wider text-[10px] text-slate-500">
            <tr>
              <th className="py-4 px-8 text-left w-12">SN</th>
              <th className="py-4 px-8 text-left">Product Name</th>
              <th className="py-4 px-8 text-right">Units Sold</th>
              <th className="py-4 px-8 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {metrics.topProducts.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-sm text-slate-400 italic">No sales data available.</td></tr>
            ) : (
              metrics.topProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-8 text-xs text-slate-400 font-mono italic">{idx + 1}</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-900">{p.name}</td>
                  <td className="py-4 px-8 text-sm text-slate-600 text-right font-mono">{p.total_qty_sold.toFixed(2)}</td>
                  <td className="py-4 px-8 text-sm text-emerald-600 font-bold text-right">₦{Number(p.total_revenue).toFixed(2)}</td>
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
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10 font-bold uppercase tracking-wider text-[10px] text-slate-500">
            <tr>
              <th className="py-4 px-8 text-left w-12">SN</th>
              <th className="py-4 px-8 text-left">Product</th>
              <th className="py-4 px-8 text-right">Stock</th>
              <th className="py-4 px-8 text-center">Health</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredInventory.length === 0 ? (
              <tr><td colSpan={4} className="py-16 text-center text-sm text-slate-400 italic">No products found.</td></tr>
            ) : (
              filteredInventory.map((p, idx) => {
                const isLow = p.quantity < p.min_quantity;
                return (
                  <tr key={p.id} className={`transition-colors hover:bg-slate-50 ${isLow ? 'bg-red-50/30' : ''}`}>
                    <td className="py-4 px-8 text-xs text-slate-400 font-mono italic">{idx + 1}</td>
                    <td className="py-4 px-8 text-sm font-bold text-slate-900">{p.name}</td>
                    <td className="py-4 px-8 text-sm text-right">
                      <span className={`font-mono font-bold ${isLow ? 'text-red-600' : 'text-slate-600'}`}>{p.quantity.toFixed(2)}</span>
                      <span className="text-slate-400 text-[10px] ml-1 uppercase">{p.unit}</span>
                    </td>
                    <td className="py-4 px-8 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-[10px] font-bold text-red-700 uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>Urgent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700 uppercase">Healthy</span>
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
