import { Search, Calendar, ChevronDown, RotateCcw } from "lucide-react";

type DashboardHeaderProps = {
  title: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  applyPreset: (range: string) => void;
  activePreset: string;
};

export default function DashboardHeader({
  title,
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  applyPreset,
  activePreset
}: DashboardHeaderProps) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] lg:border border-gray-200 dark:border-[#2C2C2E] lg:rounded-2xl px-4 lg:px-6 py-4 shadow-sm relative overflow-hidden mb-2">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-row flex-wrap xl:flex-nowrap items-center justify-between gap-4">
        {/* Section 1: Title & Search (Now Combined) */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h1 className="text-sm lg:text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none whitespace-nowrap shrink-0">{title}</h1>
          
          <div className="relative flex-1 max-w-[200px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 focus:ring-blue-400 transition-all outline-none"
            />
          </div>
        </div>

        {/* Section 2: Consolidated Controls Row */}
        <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
          {/* Range Dropdown */}
          <div className="relative shrink-0">
             <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-500 pointer-events-none" />
             <select
               value={activePreset}
               onChange={(e) => applyPreset(e.target.value)}
               className="bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] text-gray-900 dark:text-white text-[10px] font-bold rounded-xl pl-8 pr-8 py-1.5 outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-blue-400 transition-all"
             >
               <option value="today">Today</option>
               <option value="yesterday">Yesterday</option>
               <option value="7d">Last 7 Days</option>
               <option value="1m">Last Month</option>
               <option value="3m">3 Months</option>
               <option value="6m">6 Months</option>
               <option value="1y">1 Year</option>
               <option value="">Custom</option>
             </select>
             <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
          </div>

          {/* Compact Dates */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] rounded-xl px-2 py-1 shrink-0">
             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[10px] text-gray-900 dark:text-white font-bold outline-none w-[90px]" />
             <span className="text-gray-400 dark:text-gray-600 font-bold">-</span>
             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[10px] text-gray-900 dark:text-white font-bold outline-none w-[90px]" />
          </div>

          <button onClick={() => { applyPreset("7d"); setSearchQuery(""); }} className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252528] rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-[#2C2C2E] shrink-0" title="Reset">
             <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
