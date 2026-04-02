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
  RotateCcw 
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  unit: string;
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

  return (
    <div className="space-y-6">
      {/* Ultra-Compact Unified Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 shadow-2xl relative overflow-hidden mb-2">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-6">
          {/* Section 1: Title & Info */}
          <div className="shrink-0 text-center xl:text-left">
            <h1 className="text-lg font-black text-white tracking-tight leading-none">{title}</h1>
          </div>

          {/* Section 2: Search -> Presets -> Dates (Consolidated) */}
          <div className="flex flex-wrap xl:flex-nowrap items-center justify-center xl:justify-end gap-4 w-full">
            {/* Global Search */}
            <div className="relative w-full sm:w-48 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white transition-colors" />
              <input
                type="text"
                placeholder="Global search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-white placeholder:text-slate-400 focus:bg-slate-700 focus:ring-1 focus:ring-blue-400 transition-all outline-none"
              />
            </div>

            {/* Range Presets */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {["today", "yesterday", "7d", "1m", "3m", "6m", "1y"].map(range => (
                <button
                  key={range}
                  onClick={() => applyPreset(range)}
                  className={`px-2 py-1 text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all ${
                    startDate === getDatePreset(range) ? "bg-blue-500 text-white shadow-sm" : "text-white/70 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Date Inputs */}
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 shadow-inner">
                  <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">From</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[11px] text-white font-bold outline-none w-[95px] [color-scheme:dark]" />
                  <span className="text-slate-600 mx-1 font-bold">|</span>
                  <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">To</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[11px] text-white font-bold outline-none w-[95px] [color-scheme:dark]" />
               </div>
               <button onClick={() => { applyPreset("7d"); setSearchQuery(""); }} className="p-2 text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700" title="Reset">
                  <RotateCcw className="w-3.5 h-3.5" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-50 rounded-xl p-4">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Revenue</p>
                <div className="text-3xl font-bold text-slate-900">₦{metrics.totalRevenue.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-emerald-50 rounded-xl p-4">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Products</p>
                <div className="text-3xl font-bold text-slate-900">{products.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-50 rounded-xl p-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Low Stock</p>
                <div className="text-3xl font-bold text-slate-900">{lowStockCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Products by Sales */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Performance Index</h3>
              <p className="text-sm text-slate-500">Sales breakdown for selected range.</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 overflow-auto max-h-[400px]">
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-lg font-bold text-slate-900">Inventory Monitor</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-tighter">Live Status</span>
          </div>
          <div className="flex-1 overflow-auto max-h-[400px]">
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
    </div>
  );
}
