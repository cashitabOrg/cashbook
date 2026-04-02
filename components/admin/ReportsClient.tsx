"use client";

import { useState, useEffect } from "react";
import { format, subDays, subMonths, subYears, startOfYesterday, endOfYesterday } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalesReportPDF from "./SalesReportPDF";
import { Download, FileText, PackagePlus, Calendar, Filter, Search, RotateCcw, Award } from "lucide-react";

type SaleRecord = {
  id: string;
  dateStr: string;
  timestamp: string;
  managerName: string;
  productName: string;
  qty: number;
  price: number;
  revenue: number;
};

type StockInRecord = {
  id: string;
  dateStr: string;
  timestamp: string;
  productName: string;
  qtyAdded: number;
  addedBy: string;
  note: string | null;
};

export default function ReportsClient({
  storeName,
  salesData,
  stockData,
}: {
  storeName: string;
  salesData: SaleRecord[];
  stockData: StockInRecord[];
}) {
  const [activeTab, setActiveTab] = useState<"sales" | "stock">("sales");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Robust Filtering State - Default to Last 7 Days
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [managerFilter, setManagerFilter] = useState("");

  const applyPreset = (range: string) => {
    const today = new Date();
    setEndDate(format(today, "yyyy-MM-dd"));
    
    switch (range) {
      case "today":
        setStartDate(format(today, "yyyy-MM-dd"));
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setStartDate(format(yesterday, "yyyy-MM-dd"));
        setEndDate(format(yesterday, "yyyy-MM-dd"));
        break;
      case "7d":
        setStartDate(format(subDays(today, 7), "yyyy-MM-dd"));
        break;
      case "1m":
        setStartDate(format(subMonths(today, 1), "yyyy-MM-dd"));
        break;
      case "3m":
        setStartDate(format(subMonths(today, 3), "yyyy-MM-dd"));
        break;
      case "6m":
        setStartDate(format(subMonths(today, 6), "yyyy-MM-dd"));
        break;
      case "1y":
        setStartDate(format(subYears(today, 1), "yyyy-MM-dd"));
        break;
    }
  };

  const filterByRobustness = (item: any, dateField: string, searchFields: string[]) => {
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (new Date(item[dateField]) < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(item[dateField]) > end) return false;
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const matches = searchFields.some(field => 
        String(item[field] || "").toLowerCase().includes(lowerQuery)
      );
      if (!matches) return false;
    }
    if (activeTab === "sales" && managerFilter && item.managerName !== managerFilter) {
      return false;
    }
    return true;
  };

  const filteredSales = salesData.filter((item) => 
    filterByRobustness(item, "timestamp", ["productName", "managerName"])
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredStock = stockData.filter((item) => 
    filterByRobustness(item, "timestamp", ["productName", "addedBy", "note"])
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const managers = Array.from(new Set(salesData.map(s => s.managerName))).filter(Boolean).sort();
  const totalSalesRevenue = filteredSales.reduce((sum, item) => sum + item.revenue, 0);
  const totalSalesQty = filteredSales.reduce((sum, item) => sum + item.qty, 0);
  
  // Create Performance Summary for the filtered sales
  const performanceMap: Record<string, { qty: number, revenue: number }> = {};
  filteredSales.forEach(sale => {
    if (!performanceMap[sale.productName]) {
      performanceMap[sale.productName] = { qty: 0, revenue: 0 };
    }
    performanceMap[sale.productName].qty += sale.qty;
    performanceMap[sale.productName].revenue += sale.revenue;
  });
  const performanceArray = Object.entries(performanceMap).map(([name, stats]) => ({
    name,
    ...stats
  })).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Header Controls */}
      <div className="border-b border-slate-200 px-6 py-5 flex flex-col gap-5 bg-slate-50/30">
        <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
          {/* Top Left: Search & Tabs */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search report..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div className="flex bg-slate-200/50 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("sales")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === "sales" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Sales
              </button>
              <button
                onClick={() => setActiveTab("stock")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === "stock" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <PackagePlus className="w-3.5 h-3.5" />
                Inventory
              </button>
            </div>
          </div>

          {/* Export Action */}
          {activeTab === "sales" && isClient && (
            <PDFDownloadLink
              document={
                <SalesReportPDF
                  storeName={storeName}
                  period={`${startDate} to ${endDate}`}
                  data={filteredSales}
                  totalQty={totalSalesQty}
                  totalRevenue={totalSalesRevenue}
                />
              }
              fileName={`sales-report.pdf`}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              {/* @ts-ignore */}
              {({ loading }) => (
                <>
                  <Download className="w-4 h-4" />
                  {loading ? "Generating..." : "Export PDF"}
                </>
              )}
            </PDFDownloadLink>
          )}

          {activeTab === "sales" && !isClient && (
            <button disabled className="flex items-center gap-2 bg-slate-200 text-slate-400 px-5 py-2.5 rounded-xl text-xs font-black cursor-not-allowed">
              <Download className="w-4 h-4" />
              Initializing...
            </button>
          )}
        </div>

        {/* Quick Filters Row */}
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-end justify-between">
          <div className="space-y-2 w-full xl:w-auto">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quick Presets</label>
             <div className="flex flex-wrap gap-2">
                {["today", "yesterday", "7d", "1m", "3m", "6m", "1y"].map(range => (
                  <button
                    key={range}
                    onClick={() => applyPreset(range)}
                    className="px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95"
                  >
                    {range}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
             <div className="space-y-1.5 min-w-[140px]">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/10 outline-none" />
             </div>
             <div className="space-y-1.5 min-w-[140px]">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/10 outline-none" />
             </div>
             {activeTab === "sales" && (
                <div className="space-y-1.5 min-w-[150px]">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff</label>
                  <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/10 outline-none appearance-none">
                    <option value="">All Staff</option>
                    {managers.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
             )}
             <button onClick={() => { applyPreset("7d"); setSearchQuery(""); setManagerFilter(""); }} className="p-2.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all" title="Reset">
                <RotateCcw className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      {/* Report Table Area */}
      <div className="flex-1 overflow-auto flex flex-col">
        {activeTab === "sales" ? (
          <div className="h-full flex flex-col">
            
            {/* Dense Performance Summary Section */}
            {performanceArray.length > 0 && (
              <div className="bg-slate-50/50 p-4 border-b border-slate-200 shrink-0">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Performance Summary</h4>
                <div className="flex flex-wrap gap-2">
                  {performanceArray.map((item, idx) => (
                    <div key={item.name} className="bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2 flex items-center min-w-[140px]">
                        <div className="w-full">
                          <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                            {idx === 0 && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            {item.name}
                          </p>
                          <div className="flex justify-between items-center gap-4 mt-2">
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.qty.toFixed(2)} qty</span>
                            <span className="text-[10px] font-black text-emerald-600">₦{item.revenue.toFixed(2)}</span>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50 sticky top-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="py-4 px-6 text-left w-12">SN</th>
                  <th className="py-4 px-6 text-left">Date</th>
                  <th className="py-4 px-6 text-left">Manager</th>
                  <th className="py-4 px-6 text-left">Item</th>
                  <th className="py-4 px-6 text-right">Sold</th>
                  <th className="py-4 px-6 text-right">Total</th>
                  <th className="py-4 px-6 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-medium italic">No sales found for this filter.</td></tr>
                ) : (
                  filteredSales.map((sale, idx) => (
                    <tr key={sale.id} className="hover:bg-blue-100/60 transition-colors cursor-pointer group">
                      <td className="py-4 px-6 text-xs text-slate-400 font-mono italic">{idx + 1}</td>
                      <td className="py-4 px-6 text-xs text-slate-500 font-medium">{sale.dateStr}</td>
                      <td className="py-4 px-6 text-xs font-bold text-slate-900">{sale.managerName}</td>
                      <td className="py-4 px-6 text-xs font-bold text-slate-900">{sale.productName}</td>
                      <td className="py-4 px-6 text-xs text-slate-600 text-right font-mono">{sale.qty.toFixed(2)}</td>
                      <td className="py-4 px-6 text-xs text-emerald-600 font-black text-right">₦{sale.revenue.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right">
                         {/* Edit functionality restricted to Sales Point open sessions */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {filteredSales.length > 0 && (
              <div className="bg-slate-900 p-6 mt-auto flex justify-between items-center text-white rounded-t-3xl shadow-2xl">
                <div>
                  <span className="text-[10px] font-black opacity-50 uppercase tracking-widest block">Report Volume</span>
                  <span className="text-xl font-black">{totalSalesQty.toFixed(2)} Items</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black opacity-50 uppercase tracking-widest block">Total Revenue</span>
                  <span className="text-2xl font-black text-emerald-400">₦{totalSalesRevenue.toFixed(2)}</span>
                </div>
              </div>
            )}
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50 sticky top-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="py-4 px-6 text-left w-12">SN</th>
                <th className="py-4 px-6 text-left">Date</th>
                <th className="py-4 px-6 text-left">Item</th>
                <th className="py-4 px-6 text-right">Added</th>
                <th className="py-4 px-6 text-left pl-12">By</th>
                <th className="py-4 px-6 text-left whitespace-nowrap">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-medium italic">No inventory moves found.</td></tr>
              ) : (
                filteredStock.map((stock, idx) => (
                  <tr key={stock.id} className="hover:bg-blue-100/60 transition-colors cursor-pointer group">
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono italic">{idx + 1}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 font-medium">{stock.dateStr}</td>
                    <td className="py-4 px-6 text-xs font-bold text-slate-900">{stock.productName}</td>
                    <td className="py-4 px-6 text-xs text-emerald-600 font-black text-right">+{stock.qtyAdded.toFixed(2)}</td>
                    <td className="py-4 px-6 text-xs font-bold text-slate-500 pl-12">{stock.addedBy}</td>
                    <td className="py-4 px-6 text-xs text-slate-400 italic max-w-xs truncate">{stock.note || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
