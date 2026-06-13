"use client";

import { useState } from "react";
import { Search, Calendar, RotateCcw, Download, ChevronDown } from "lucide-react";
import { format, subDays, subMonths, subYears } from "date-fns";
import { toLagosDateString } from "@/lib/date-utils";
import dynamic from "next/dynamic";
import { toast } from "sonner";

// Dynamically import the PDF button with SSR disabled.
// @react-pdf/renderer uses browser-only canvas APIs (frame.join etc.) that crash on the server.
const PDFExportButton = dynamic(
  () => import("./PDFExportButton"),
  { ssr: false, loading: () => <span className="text-xs text-gray-400 animate-pulse">Loading PDF...</span> }
);

type ReportsHeaderProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  applyPreset: (range: string) => void;
  isClient: boolean;
  isPreparingExport: boolean;
  setIsPreparingExport: (val: boolean) => void;
  storeName: string;
  filteredSales: any[];
  totalSalesQty: number;
  totalSalesRevenue: number;
  totalSalesProfit: number;
  performanceArray: any[];
  canExportReports: boolean;
};

export default function ReportsHeader({
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  applyPreset,
  isClient,
  isPreparingExport,
  setIsPreparingExport,
  storeName,
  filteredSales,
  totalSalesQty,
  totalSalesRevenue,
  totalSalesProfit,
  performanceArray,
  canExportReports,
}: ReportsHeaderProps) {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const getActivePreset = () => {
    if (!startDate || !endDate) return "7d";
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

  const activePreset = getActivePreset();

  const handleSelectChange = (value: string) => {
    if (value === "") {
      const todayLagos = toLagosDateString(new Date());
      setTempStartDate(startDate || todayLagos);
      setTempEndDate(endDate || todayLagos);
      setIsCustomModalOpen(true);
    } else {
      applyPreset(value);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] lg:border border-gray-200 dark:border-[#2C2C2E] lg:rounded-2xl px-4 lg:px-6 py-3.5 shadow-sm relative overflow-hidden mb-2 transition-colors">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-20 flex flex-row items-center justify-between gap-1.5 sm:gap-3 w-full">
        {/* Search Box */}
        <div className="relative flex-1 min-w-0 max-w-xs md:max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 focus:ring-blue-400 transition-all outline-none font-medium"
          />
        </div>

        {/* Date Filters & Controls Row */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto scrollbar-none pb-0.5 pt-0.5">
          {/* Range Dropdown */}
          <div className="relative shrink-0">
             <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-500 pointer-events-none" />
             <select
               value={activePreset}
               onChange={(e) => handleSelectChange(e.target.value)}
               className="bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] text-gray-900 dark:text-white text-[10px] font-bold rounded-xl pl-7 pr-7 py-1.5 sm:pl-8 sm:pr-8 outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-blue-400 transition-all"
             >
               <option value="today">Today</option>
               <option value="yesterday">Yesterday</option>
               <option value="7d">Last 7 Days</option>
               <option value="1m">Last Month</option>
               <option value="3m">3 Months</option>
               <option value="6m">6 Months</option>
               <option value="1y">1 Year</option>
               <option value="">Custom Range</option>
             </select>
             <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
          </div>

          {/* PDF Export Button */}
          {isClient && (
            <>
              {!isPreparingExport ? (
                <button 
                  onClick={() => {
                    if (!canExportReports) {
                      toast.error("Upgrade to Basic or Pro to unlock PDF exporting.");
                      return;
                    }
                    setIsPreparingExport(true);
                  }}
                  className="bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors shadow-sm flex items-center gap-1.5 text-[10px] font-bold shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden sm:inline">EXPORT PDF</span>
                </button>
              ) : (
                <PDFExportButton
                  storeName={storeName}
                  startDate={startDate}
                  endDate={endDate}
                  filteredSales={filteredSales}
                  totalSalesQty={totalSalesQty}
                  totalSalesRevenue={totalSalesRevenue}
                  totalSalesProfit={totalSalesProfit}
                  performanceArray={performanceArray}
                  onDownloaded={() => setIsPreparingExport(false)}
                />
              )}
            </>
          )}

          {/* Reset Button */}
          <button 
            onClick={() => { applyPreset("7d"); setSearchQuery(""); }} 
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252528] rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-[#2C2C2E] shrink-0"
            title="Reset"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Custom Date Range Pop-up Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-2xl p-5 shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Select Date Range
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Start Date</label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] text-gray-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-blue-400 transition-all w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">End Date</label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] text-gray-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-blue-400 transition-all w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStartDate(tempStartDate);
                  setEndDate(tempEndDate);
                  setIsCustomModalOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
