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
  );
}
