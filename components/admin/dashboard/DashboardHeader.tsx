"use client";

import { useState } from "react";
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
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const handleSelectChange = (value: string) => {
    if (value === "") {
      setTempStartDate(startDate || new Date().toISOString().split("T")[0]);
      setTempEndDate(endDate || new Date().toISOString().split("T")[0]);
      setIsCustomModalOpen(true);
    } else {
      applyPreset(value);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] lg:border border-gray-200 dark:border-[#2C2C2E] lg:rounded-2xl px-4 lg:px-6 py-3.5 shadow-sm relative overflow-hidden mb-2">
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

          <button onClick={() => { applyPreset("today"); setSearchQuery(""); }} className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252528] rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-[#2C2C2E] shrink-0" title="Reset">
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
