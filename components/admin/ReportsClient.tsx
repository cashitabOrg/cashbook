"use client";

import { useState, useEffect } from "react";
import { format, subDays, subMonths, subYears, parseISO } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalesReportPDF from "./SalesReportPDF";
import { Download, FileText, PackagePlus, Calendar, Filter, Search, RotateCcw, Award, ChevronDown, ChevronUp, ChevronRight, TrendingUp, Package, CheckCircle2, Clock } from "lucide-react";
import { approveDailySales } from "@/app/actions/sales";
import { toast } from "sonner";

type SaleRecord = {
  id: string;
  dateStr: string;
  timestamp: string;
  managerName: string;
  productName: string;
  qty: number;
  price: number;
  revenue: number;
  cost: number;
  profit: number;
  sessionId?: string;
  approvalStatus?: string;
};

type StockInRecord = {
  id: string;
  dateStr: string;
  timestamp: string;
  productName: string;
  qtyAdded: number;
  unitCost: number;
  totalCost: number;
  addedBy: string;
  note: string | null;
};

export default function ReportsClient({
  storeId,
  storeName,
  salesData,
  stockData,
}: {
  storeId: string;
  storeName: string;
  salesData: SaleRecord[];
  stockData: StockInRecord[];
}) {
  const [activeTab, setActiveTab] = useState<"sales" | "stock">("sales");
  const [isClient, setIsClient] = useState(false);
  const [approvingDate, setApprovingDate] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Robust Filtering State - Default to Last 7 Days
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, "logs" | "intel">>( {});

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
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const filteredStock = stockData.filter((item) => 
    filterByRobustness(item, "timestamp", ["productName", "addedBy", "note"])
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Grouping Logic
  const groupSalesByDate = () => {
    const groups: Record<string, { 
      items: SaleRecord[], 
      revenue: number, 
      expectedRevenue: number,
      qty: number, 
      isFullyApproved: boolean 
    }> = {};
    
    filteredSales.forEach(s => {
      const dayKey = s.timestamp.split('T')[0];
      if (!groups[dayKey]) groups[dayKey] = { items: [], revenue: 0, expectedRevenue: 0, qty: 0, isFullyApproved: true };
      groups[dayKey].items.push(s);
      groups[dayKey].revenue += s.revenue;
      groups[dayKey].expectedRevenue += s.qty * s.price; // s.price is the snapshot of 'official' price
      groups[dayKey].qty += s.qty;
      if (s.approvalStatus !== 'approved') {
        groups[dayKey].isFullyApproved = false;
      }
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const groupStockByDate = () => {
    const groups: Record<string, { items: StockInRecord[], totalAdded: number }> = {};
    filteredStock.forEach(s => {
      const dayKey = s.timestamp.split('T')[0];
      if (!groups[dayKey]) groups[dayKey] = { items: [], totalAdded: 0 };
      groups[dayKey].items.push(s);
      groups[dayKey].totalAdded += s.qtyAdded;
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const groupedSales = groupSalesByDate();
  const groupedStock = groupStockByDate();

  // Auto-expand latest date when data changes
  useEffect(() => {
    if (activeTab === "sales" && groupedSales.length > 0) {
      setExpandedDates(prev => ({ ...prev, [groupedSales[0][0]]: true }));
    } else if (activeTab === "stock" && groupedStock.length > 0) {
      setExpandedDates(prev => ({ ...prev, [groupedStock[0][0]]: true }));
    }
  }, [activeTab, filteredSales.length, filteredStock.length]);

  const toggleDate = (dateStr: string) => {
    setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const handleApproveDay = async (dateStr: string) => {
    setApprovingDate(dateStr);
    const reason = window.prompt(`Are you sure you want to approve all sales on ${dateStr}? This will permanently lock them. You can optionally type a reason/note here:`);
    if (reason === null) {
      // Prompt was cancelled
      setApprovingDate(null);
      return;
    }
    
    // Attempt approval server action
    const res = await approveDailySales(dateStr, storeId, reason);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Successfully approved sales for ${dateStr}!`);
    }
    setApprovingDate(null);
  }

  const managers = Array.from(new Set(salesData.map(s => s.managerName))).filter(Boolean).sort();
  const totalSalesRevenue = filteredSales.reduce((sum, item) => sum + item.revenue, 0);
  const totalSalesProfit = filteredSales.reduce((sum, item) => sum + item.profit, 0);
  const totalSalesQty = filteredSales.reduce((sum, item) => sum + item.qty, 0);
  
  // Performance Summary
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
    <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 overflow-hidden flex flex-col h-[calc(100dvh-56px)] md:h-full min-h-[500px]">
      {/* Ultra-Compact Unified Header (Dashboard Style) */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 lg:px-6 py-4 shadow-2xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-4">
          {/* Section 1: Title & Search & Tabs (Now Combined) */}
          <div className="flex items-center gap-2 lg:gap-6 w-full xl:w-auto overflow-x-auto scrollbar-hide pb-1 xl:pb-0">
            <h1 className="text-sm lg:text-lg font-black text-white tracking-tight leading-none shrink-0 whitespace-nowrap">Reports</h1>
            
            <div className="relative flex-1 min-w-[120px] max-w-[180px] group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-[10px] text-white placeholder:text-slate-500 focus:bg-slate-700 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
              />
            </div>

            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700 shrink-0">
              <button
                onClick={() => setActiveTab("sales")}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === "sales" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3 h-3" />
                Sales
              </button>
              <button
                onClick={() => setActiveTab("stock")}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === "stock" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <PackagePlus className="w-3 h-3" />
                Inventory
              </button>
            </div>
          </div>

          {/* Section 2: Consolidated Controls Row */}
          <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
            {/* Range Dropdown */}
            <div className="relative shrink-0">
               <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400 pointer-events-none" />
               <select
                 onChange={(e) => applyPreset(e.target.value)}
                 className="bg-slate-800 border border-slate-700 text-white text-[11px] font-bold rounded-xl pl-8 pr-8 py-1.5 outline-none appearance-none cursor-pointer focus:bg-slate-700 transition-all"
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



            {/* Staff member dropdown (Sales Only) */}
            {activeTab === "sales" && (
              <div className="relative group min-w-[120px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <select 
                  value={managerFilter} 
                  onChange={(e) => setManagerFilter(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-1.5 text-[11px] font-bold text-white outline-none appearance-none cursor-pointer focus:bg-slate-700"
                >
                  <option value="">All Managers</option>
                  {managers.map(m => <option key={m} value={m} className="bg-slate-800">{m}</option>)}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 ml-2">
            <button 
              onClick={() => { applyPreset("7d"); setSearchQuery(""); setManagerFilter(""); }} 
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-all shrink-0" 
              title="Reset All"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            {activeTab === "sales" && isClient && (
              <PDFDownloadLink
                document={
                  <SalesReportPDF
                    storeName={storeName}
                    period={`${startDate} to ${endDate}`}
                    data={filteredSales}
                    totalQty={totalSalesQty}
                    totalRevenue={totalSalesRevenue}
                    totalProfit={totalSalesProfit}
                    performanceSummary={performanceArray}
                  />
                }
                fileName={`sales-report.pdf`}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black transition-all shadow-lg active:scale-95 shrink-0 whitespace-nowrap"
              >
                {/* @ts-ignore */}
                {({ loading }) => (
                  <>
                    <Download className="w-3 h-3" />
                    {loading ? "..." : "EXPORT"}
                  </>
                )}
              </PDFDownloadLink>
            )}
          </div>
          </div>
        </div>
      </div>


      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50/50 px-2 lg:px-0">
        <div className="lg:p-6 space-y-4">
          {activeTab === "sales" ? (
            groupedSales.length === 0 ? (
              <div className="py-20 text-center text-slate-400 italic">No sales found for this period.</div>
            ) : (
              groupedSales.map(([date, data]) => {
                // Calculate Daily Performance & Intelligence Summary
                const productSummary: Record<string, { 
                  qty: number, 
                  recordedRevenue: number, 
                  expectedRevenue: number,
                  unitPrice: number,
                  unitCost: number
                }> = {};
                
                data.items.forEach(item => {
                  if (!productSummary[item.productName]) {
                    productSummary[item.productName] = { 
                      qty: 0, 
                      recordedRevenue: 0, 
                      expectedRevenue: 0,
                      unitPrice: item.price,
                      unitCost: item.cost
                    };
                  }
                  productSummary[item.productName].qty += item.qty;
                  productSummary[item.productName].recordedRevenue += item.revenue;
                  productSummary[item.productName].expectedRevenue += item.qty * item.price;
                });

                const sortedIntelligence = Object.entries(productSummary)
                  .map(([name, stats]) => ({ name, ...stats, variance: stats.recordedRevenue - stats.expectedRevenue }))
                  .sort((a, b) => b.recordedRevenue - a.recordedRevenue);

                // Original simple performance map for the restored cards
                const sortedPerformance = sortedIntelligence.map(s => ({ name: s.name, qty: s.qty, revenue: s.recordedRevenue }));

                return (
                  <div key={date} className="bg-white lg:border border-slate-200 lg:rounded-xl shadow-sm overflow-hidden transition-all duration-200">
                    <button
                      onClick={() => toggleDate(date)}
                      className="w-full px-4 lg:px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-transparent data-[expanded=true]:border-slate-100"
                      data-expanded={expandedDates[date]}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${data.isFullyApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          {data.isFullyApproved ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                        </div>
                        <div className="text-left flex items-center gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{format(parseISO(date), "EEEE, MMM do yyyy")}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{data.items.length} records</p>
                          </div>
                          {data.isFullyApproved ? (
                            <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 md:gap-10">
                        <div className="hidden md:block text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Variance (Audit)</p>
                          <p className={`text-sm font-black ${(data.revenue - data.expectedRevenue) < -1 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            { (data.revenue - data.expectedRevenue) < -1 ? `₦${(data.revenue - data.expectedRevenue).toFixed(2)}` : 'MATCH' }
                          </p>
                        </div>
                        <div className="hidden md:block text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Revenue</p>
                          <p className="text-sm font-black text-emerald-600">₦{data.revenue.toFixed(2)}</p>
                        </div>
                        <div className="text-slate-400">
                           <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${expandedDates[date] ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                    </button>
                    
                    {expandedDates[date] && (
                      <div className="p-2 lg:p-4 bg-slate-50/30">
                        {!data.isFullyApproved && (
                          <div className="mb-4 flex flex-col sm:flex-row items-center justify-between bg-white border border-amber-200 p-4 rounded-xl shadow-sm">
                            <div>
                               <h4 className="text-xs font-bold text-slate-900">Approve Sales for {date}</h4>
                               <p className="text-[11px] text-slate-500">Approving these records will permanently lock them and prevent managers from making edits.</p>
                            </div>
                            <button 
                               onClick={(e) => { e.stopPropagation(); handleApproveDay(date); }}
                               disabled={approvingDate === date}
                               className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap"
                            >
                               {approvingDate === date ? 'Approving...' : 'Approve Daily Sales'}
                            </button>
                          </div>
                        )}

                        {/* RESTORED: Daily Performance Summary Grid (Original Look) */}
                        <div className="mb-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                             <TrendingUp className="w-3 h-3 text-blue-500" />
                             Product Performance Summary
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                             {sortedPerformance.map((item) => (
                               <div key={item.name} className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between hover:border-blue-300 transition-colors shadow-sm">
                                  <span className="text-[11px] font-bold text-slate-900 truncate mb-1" title={item.name}>{item.name}</span>
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500 font-mono italic">{item.qty.toFixed(2)} qty</span>
                                    <span className="text-emerald-600 font-black">₦{item.revenue.toFixed(2)}</span>
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* NEW: Sub-Tab Switcher for Logs vs Intelligence */}
                        <div className="flex bg-slate-200/50 p-1 rounded-xl mb-4 w-fit border border-slate-200">
                          <button
                            onClick={() => setActiveSubTabs(prev => ({ ...prev, [date]: "logs" }))}
                            className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                              (activeSubTabs[date] || "logs") === "logs" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            Sales Logs
                          </button>
                          <button
                            onClick={() => setActiveSubTabs(prev => ({ ...prev, [date]: "intel" }))}
                            className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                              activeSubTabs[date] === "intel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            Sales Intelligence
                          </button>
                        </div>

                        {(activeSubTabs[date] || "logs") === "intel" ? (
                           /* Sales Intelligence Tab */
                           <div className="mb-6 animate-in fade-in duration-300">
                              <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                                 <div className="overflow-x-auto">
                                   <table className="min-w-full divide-y divide-slate-100">
                                      <thead>
                                         <tr className="bg-slate-50/50 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                           <th className="py-2.5 px-4 text-left">Product</th>
                                           <th className="py-2.5 px-4 text-right">Qty Sold</th>
                                           <th className="py-2.5 px-4 text-right">Unit Cost</th>
                                           <th className="py-2.5 px-4 text-right">Official Selling Price</th>
                                           <th className="py-2.5 px-4 text-right">Manager Sales</th>
                                           <th className="py-2.5 px-4 text-right">Expected Revenue</th>
                                           <th className="py-2.5 px-4 text-right pr-6">Audited Variance</th>
                                         </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                         {sortedIntelligence.map((stats) => (
                                           <tr key={stats.name} className="text-[11px] hover:bg-blue-50/60 transition-colors cursor-default">
                                             <td className="py-3 px-4 font-bold text-slate-900">{stats.name}</td>
                                             <td className="py-3 px-4 text-right text-slate-500 font-mono">{stats.qty.toFixed(2)}</td>
                                             <td className="py-3 px-4 text-right text-slate-400 font-mono italic">₦{stats.unitCost.toFixed(2)}</td>
                                             <td className="py-3 px-4 text-right text-slate-400 font-mono italic">₦{stats.unitPrice.toFixed(2)}</td>
                                             <td className="py-3 px-4 text-right font-bold text-slate-900">₦{stats.recordedRevenue.toFixed(2)}</td>
                                             <td className="py-3 px-4 text-right text-slate-500 font-bold">₦{stats.expectedRevenue.toFixed(2)}</td>
                                             <td className={`py-3 px-4 text-right font-black pr-6 ${stats.variance < -1 ? 'text-rose-600' : stats.variance > 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                               {stats.variance < -1 ? `-₦${Math.abs(stats.variance).toFixed(2)}` : stats.variance > 1 ? `+₦${stats.variance.toFixed(2)}` : 'MATCH'}
                                             </td>
                                           </tr>
                                         ))}
                                      </tbody>
                                   </table>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           /* Sales Activity Tab (Original Log Appearance) */
                           <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-300">
                              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sales Activity</span>
                                 <span className="text-[9px] text-slate-300 font-mono">ID: {date}</span>
                              </div>
                              <div className="overflow-x-auto">
                                 <table className="min-w-full divide-y divide-slate-100">
                                    <thead>
                                      <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50/50">
                                        <th className="py-2 px-4 text-left w-12">SN</th>
                                        <th className="py-2 px-4 text-left">Time</th>
                                        <th className="py-2 px-4 text-left">Manager</th>
                                        <th className="py-2 px-4 text-left">Product</th>
                                        <th className="py-2 px-4 text-right">Sold</th>
                                        <th className="py-2 px-4 text-right pr-6">Revenue</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                      {data.items.map((sale, idx) => (
                                        <tr key={sale.id} className="hover:bg-blue-50/50 text-[11px] transition-colors">
                                          <td className="py-2 px-4 text-slate-400 font-mono italic">{idx + 1}</td>
                                          <td className="py-2 px-4 text-slate-500 font-medium">{format(parseISO(sale.timestamp), "HH:mm")}</td>
                                          <td className="py-2 px-4 font-bold text-slate-700">{sale.managerName}</td>
                                          <td className="py-2 px-4 font-medium text-slate-900">{sale.productName}</td>
                                          <td className="py-2 px-4 text-slate-600 text-right font-mono">{sale.qty.toFixed(2)}</td>
                                          <td className="py-2 px-4 font-black text-emerald-600 text-right pr-6">₦{sale.revenue.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            groupedStock.length === 0 ? (
              <div className="py-20 text-center text-slate-400 italic">No inventory moves found.</div>
            ) : (
              groupedStock.map(([date, data]) => {
                // Calculate stock added summary per product
                const stockMap: Record<string, number> = {};
                data.items.forEach(item => {
                  stockMap[item.productName] = (stockMap[item.productName] || 0) + item.qtyAdded;
                });

                const sortedStock = Object.entries(stockMap)
                  .map(([name, qty]) => ({ name, qty }))
                  .sort((a, b) => b.qty - a.qty);

                return (
                  <div key={date} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200">
                    <button
                      onClick={() => toggleDate(date)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-transparent data-[expanded=true]:border-slate-100"
                      data-expanded={expandedDates[date]}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                          <PackagePlus className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-bold text-slate-900">{format(parseISO(date), "EEEE, MMM do yyyy")}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{data.items.length} moves</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-10">
                        <div className="hidden md:block text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Net Stock Added</p>
                          <p className="text-sm font-black text-emerald-600">+{data.totalAdded.toFixed(2)} units</p>
                        </div>
                        <div className="text-slate-400">
                           <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${expandedDates[date] ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                    </button>

                    {expandedDates[date] && (
                      <div className="p-2 lg:p-4 bg-slate-50/30">
                        {/* Daily Stock Summary */}
                        <div className="mb-4 lg:mb-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                             <Package className="w-3 h-3 text-emerald-500" />
                             Daily Replenishment Summary
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
                             {sortedStock.map((item) => (
                               <div key={item.name} className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between hover:border-emerald-300 transition-colors shadow-sm min-w-0 overflow-hidden">
                                  <span className="text-[11px] font-bold text-slate-900 truncate flex-1" title={item.name}>{item.name}</span>
                                  <span className="text-[11px] font-black text-emerald-600 ml-2 whitespace-nowrap">+{item.qty.toFixed(2)}</span>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* Detailed Move Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                           <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Restock Log</span>
                              <span className="text-[9px] text-slate-300 font-mono">ID: {date}</span>
                           </div>
                           <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-100">
                                 <thead>
                                   <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50/50">
                                     <th className="py-2 px-4 text-left w-12">SN</th>
                                     <th className="py-2 px-4 text-left">Time</th>
                                     <th className="py-2 px-4 text-left">Product</th>
                                     <th className="py-2 px-4 text-right">Qty</th>
                                     <th className="py-2 px-4 text-right">Unit cost</th>
                                     <th className="py-2 px-4 text-right pr-6">Total Exp.</th>
                                     <th className="py-2 px-4 text-left pl-6">By</th>
                                     <th className="py-2 px-4 text-left pr-6">Notes</th>
                                   </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-50">
                                   {data.items.map((stock, idx) => (
                                     <tr key={stock.id} className="hover:bg-emerald-50/50 text-[11px] transition-colors">
                                       <td className="py-2 px-4 text-slate-400 font-mono italic">{idx + 1}</td>
                                       <td className="py-2 px-4 text-slate-500 font-medium">{format(parseISO(stock.timestamp), "HH:mm")}</td>
                                       <td className="py-2 px-4 font-bold text-slate-900">{stock.productName}</td>
                                       <td className="py-2 px-4 text-slate-900 font-bold text-right">{stock.qtyAdded.toFixed(2)}</td>
                                       <td className="py-2 px-4 text-slate-500 text-right font-mono">₦{stock.unitCost.toFixed(2)}</td>
                                       <td className="py-2 px-4 font-black text-blue-600 text-right pr-6">₦{stock.totalCost.toFixed(2)}</td>
                                       <td className="py-2 px-4 text-slate-600 font-medium pl-6">{stock.addedBy}</td>
                                       <td className="py-2 px-4 text-slate-400 italic truncate max-w-[200px] pr-6">{stock.note || "—"}</td>
                                     </tr>
                                   ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>

      </div>

    </div>
  );
}
