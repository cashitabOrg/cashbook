import { Search, Calendar, Filter, RotateCcw, Download } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalesReportPDF from "../SalesReportPDF";

type ReportsHeaderProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  managerFilter: string;
  setManagerFilter: (val: string) => void;
  managers: string[];
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
};

export default function ReportsHeader({
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  managerFilter,
  setManagerFilter,
  managers,
  applyPreset,
  isClient,
  isPreparingExport,
  setIsPreparingExport,
  storeName,
  filteredSales,
  totalSalesQty,
  totalSalesRevenue,
  totalSalesProfit,
  performanceArray
}: ReportsHeaderProps) {
  return (
    <div className="bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-[#2C2C2E] px-4 lg:px-6 py-4 shrink-0 transition-colors">
      <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 lg:gap-6 w-full xl:w-auto overflow-x-auto scrollbar-hide pb-1 xl:pb-0">
          <h1 className="text-sm lg:text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none shrink-0 border-b-2 border-blue-500 pb-1 uppercase">Sales Reconciliation</h1>
          
          <div className="relative flex-1 min-w-[120px] max-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#252528] border border-gray-200 dark:border-[#3A3A3C] rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
          <div className="relative shrink-0">
             <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500 pointer-events-none" />
             <select
               onChange={(e) => applyPreset(e.target.value)}
               className="bg-white dark:bg-[#252528] border border-gray-200 dark:border-[#3A3A3C] text-gray-700 dark:text-white text-xs font-semibold rounded-xl pl-8 pr-8 py-1.5 outline-none appearance-none cursor-pointer transition-colors"
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

          <div className="flex items-center gap-1 bg-white dark:bg-[#252528] border border-gray-200 dark:border-[#3A3A3C] rounded-xl px-2 py-1 shrink-0 transition-colors">
             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs text-gray-700 dark:text-white font-semibold outline-none [color-scheme:light] dark:[color-scheme:dark]" />
             <span className="text-gray-400 dark:text-gray-500">-</span>
             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs text-gray-700 dark:text-white font-semibold outline-none [color-scheme:light] dark:[color-scheme:dark]" />
          </div>

          <div className="relative min-w-[120px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <select 
              value={managerFilter} 
              onChange={(e) => setManagerFilter(e.target.value)} 
              className="w-full bg-white dark:bg-[#252528] border border-gray-200 dark:border-[#3A3A3C] rounded-xl pl-8 pr-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-white outline-none appearance-none transition-colors"
            >
              <option value="">All Managers</option>
              {managers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <button onClick={() => { applyPreset("7d"); setSearchQuery(""); setManagerFilter(""); }} className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-[#252528] border border-gray-200 dark:border-[#3A3A3C] rounded-lg transition-all shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {isClient && (
            <>
              {!isPreparingExport ? (
                <button 
                  onClick={() => setIsPreparingExport(true)}
                  className="bg-white dark:bg-[#252528] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-[#3A3A3C] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" /> EXPORT PDF
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
                  className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 animate-pulse"
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
  );
}
