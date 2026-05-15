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
};

export default function DashboardHeader({
  title,
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  applyPreset
}: DashboardHeaderProps) {
  return (
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
  );
}
