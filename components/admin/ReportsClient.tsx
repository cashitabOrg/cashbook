"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, subDays, subMonths, subYears, parseISO } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalesReportPDF from "./SalesReportPDF";
import { Download, FileText, Calendar, Filter, Search, RotateCcw, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { toLagosDateString } from "@/lib/date-utils";
import { approveDailySales } from "@/app/actions/sales";
import { toast } from "sonner";

import DailySalesRow from "./DailySalesRow";

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

type StockAdjustmentRecord = {
  id: string;
  dateStr: string;
  timestamp: string;
  productName: string;
  qtyChange: number;
  reason: string;
  adjustedBy: string;
  note: string | null;
};


export default function ReportsClient({
  storeId,
  storeName,
  plan,
  isBillingExempt,
  salesData,
}: {
  storeId: string;
  storeName: string;
  plan: string;
  isBillingExempt: boolean;
  salesData: SaleRecord[];
}) {
  const [isClient, setIsClient] = useState(false);
  const [approvingDate, setApprovingDate] = useState<string | null>(null);
  const [isPreparingExport, setIsPreparingExport] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Robust Filtering State - Default to Last 7 Days
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

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

  const filterItem = (item: any, dateField: string, searchFields: string[]) => {
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
    if (managerFilter && item.managerName !== managerFilter) {
      return false;
    }
    return true;
  };

  const filteredSales = useMemo(() => 
    salesData.filter((item) => filterItem(item, "timestamp", ["productName", "managerName"]))
  , [salesData, startDate, endDate, searchQuery, managerFilter]);

  // Grouping Logic
  const groupedSales = useMemo(() => {
    const groups: Record<string, { 
      items: SaleRecord[], 
      revenue: number, 
      expectedRevenue: number,
      qty: number, 
      isFullyApproved: boolean 
    }> = {};
    
    filteredSales.forEach(s => {
      const dayKey = toLagosDateString(s.timestamp);
      if (!groups[dayKey]) groups[dayKey] = { items: [], revenue: 0, expectedRevenue: 0, qty: 0, isFullyApproved: true };
      groups[dayKey].items.push(s);
      groups[dayKey].revenue += s.revenue;
      groups[dayKey].expectedRevenue += s.qty * s.price;
      groups[dayKey].qty += s.qty;
      if (s.approvalStatus !== 'approved') {
        groups[dayKey].isFullyApproved = false;
      }
    });

    // Sort Descending (Newest first)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredSales]);

  // Auto-expand latest date when data changes
  useEffect(() => {
    if (groupedSales.length > 0) {
      setExpandedDates({ [groupedSales[0][0]]: true });
    }
  }, [groupedSales.length]);

  const handleApproveDay = useCallback(async (dateStr: string) => {
    setApprovingDate(dateStr);
    const reason = window.prompt(`Approve sales for ${dateStr}? This locks the data permanently. Note (optional):`);
    if (reason === null) {
      setApprovingDate(null);
      return;
    }
    
    const res = await approveDailySales(dateStr, storeId, reason);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Approved sales for ${dateStr}!`);
    }
    setApprovingDate(null);
  }, [storeId]);

  const toggleExpanded = useCallback((key: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const managers = useMemo(() => Array.from(new Set(salesData.map(s => s.managerName))).filter(Boolean).sort(), [salesData]);
  const totalSalesRevenue = useMemo(() => filteredSales.reduce((sum, item) => sum + item.revenue, 0), [filteredSales]);
  const totalSalesProfit = useMemo(() => filteredSales.reduce((sum, item) => sum + item.profit, 0), [filteredSales]);
  const totalSalesQty = useMemo(() => filteredSales.reduce((sum, item) => sum + item.qty, 0), [filteredSales]);
  
  const performanceArray = useMemo(() => {
    const map: Record<string, { qty: number, revenue: number }> = {};
    filteredSales.forEach(sale => {
      if (!map[sale.productName]) map[sale.productName] = { qty: 0, revenue: 0 };
      map[sale.productName].qty += sale.qty;
      map[sale.productName].revenue += sale.revenue;
    });
    return Object.entries(map).map(([name, stats]) => ({ name, ...stats })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  return (
    <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 overflow-hidden flex flex-col h-[calc(100dvh-56px)] md:h-full min-h-[500px]">
      <div className="bg-slate-900 border-b border-slate-800 px-4 lg:px-6 py-4 shadow-2xl shrink-0">
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 lg:gap-6 w-full xl:w-auto overflow-x-auto scrollbar-hide pb-1 xl:pb-0">
            <h1 className="text-sm lg:text-lg font-black text-white tracking-tight leading-none shrink-0 border-b-2 border-blue-600 pb-1 uppercase">Sales Reconciliation</h1>
            
            <div className="relative flex-1 min-w-[120px] max-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-[10px] text-white outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
            <div className="relative shrink-0">
               <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400 pointer-events-none" />
               <select
                 onChange={(e) => applyPreset(e.target.value)}
                 className="bg-slate-800 border border-slate-700 text-white text-[11px] font-bold rounded-xl pl-8 pr-8 py-1.5 outline-none appearance-none cursor-pointer"
               >
                 <option value="7d">Last 7 Days</option>
                 <option value="today">Today</option>
                 <option value="yesterday">Yesterday</option>
                 <option value="1m">Last Month</option>
                 <option value="3m">3 Months</option>
                 <option value="6m">6 Months</option>
                 <option value="1y">1 Year</option>
               </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-xl px-2 py-1 shrink-0">
               <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[10px] text-white font-bold outline-none [color-scheme:dark]" />
               <span className="text-slate-600">-</span>
               <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[10px] text-white font-bold outline-none [color-scheme:dark]" />
            </div>

            <div className="relative min-w-[120px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <select 
                value={managerFilter} 
                onChange={(e) => setManagerFilter(e.target.value)} 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-1.5 text-[11px] font-bold text-white outline-none appearance-none"
              >
                <option value="">All Managers</option>
                {managers.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <button onClick={() => { applyPreset("7d"); setSearchQuery(""); setManagerFilter(""); }} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-all shrink-0">
              <RotateCcw className="w-3 h-3" />
            </button>

            {isClient && (
              <>
                {!isPreparingExport ? (
                  <button 
                    onClick={() => setIsPreparingExport(true)}
                    className="bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 hover:bg-slate-700 transition-colors"
                  >
                    <Download className="w-3 h-3 text-blue-400" /> EXPORT PDF
                  </button>
                ) : (
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
                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-lg active:scale-95 animate-pulse"
                    onClick={() => setTimeout(() => setIsPreparingExport(false), 2000)}
                  >
                    {/* @ts-ignore */}
                    {({ loading }) => loading ? "GENERATING..." : <><Download className="w-3 h-3" /> READY! DOWNLOAD</>}
                  </PDFDownloadLink>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {groupedSales.length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic font-medium">No sales found for this period.</div>
        ) : (
          groupedSales.map(([date, data]) => (
            <DailySalesRow 
              key={date}
              dateStr={date}
              data={data}
              plan={plan}
              isExempt={isBillingExempt}
              storeId={storeId}
              approvingDate={approvingDate}
              onApprove={handleApproveDay}
              isExpanded={!!expandedDates[date]}
              onToggle={toggleExpanded}
            />
          ))
        )}
      </div>
    </div>
  );
}

