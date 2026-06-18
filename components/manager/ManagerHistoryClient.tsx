"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Search, ChevronDown, RotateCcw, Filter } from "lucide-react";
import { format, subDays, subMonths, subYears } from "date-fns";
import ManagerHistoryRow from "./ManagerHistoryRow";
import { toTimeZoneDateString } from "@/lib/date-utils";

type ItemDetail = {
  id?: string;
  productId: string;
  productName: string;
  qtySold: number;
  revenue: number;
  createdAt?: string;
};

type SessionSummary = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalRevenue: number;
  itemsCount: number;
  approvalStatus: string;
  items: ItemDetail[];
};

type DailyGroup = {
  dateStr: string;
  sessions: SessionSummary[];
  dailyTotalRevenue: number;
  dailyTotalItems: number;
  isFullyApproved: boolean;
  productBreakdown: Record<string, ItemDetail>;
};

export default function ManagerHistoryClient({
  dailyGroups,
  availableProducts = [],
  timezone = "Africa/Lagos",
}: {
  dailyGroups: DailyGroup[];
  availableProducts?: { id: string; name: string; }[];
  timezone?: string;
}) {
  const router = useRouter();


  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
    dailyGroups.length > 0 ? { [dailyGroups[0].dateStr]: true } : {}
  );

  // ── Filter State ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all");
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  // ── Preset Application ─────────────────────────────────────────
  const applyPreset = useCallback((range: string) => {
    const todayLagosStr = toTimeZoneDateString(new Date(), timezone);
    const baseDate = new Date(todayLagosStr);
    
    setActivePreset(range);
    if (range === "all") {
      setStartDate(""); setEndDate("");
    } else if (range === "today") {
      setStartDate(todayLagosStr); setEndDate(todayLagosStr);
    } else if (range === "yesterday") {
      const y = toTimeZoneDateString(subDays(baseDate, 1), timezone);
      setStartDate(y); setEndDate(y);
    } else if (range === "7d") {
      setStartDate(toTimeZoneDateString(subDays(baseDate, 7), timezone)); setEndDate(todayLagosStr);
    } else if (range === "1m") {
      setStartDate(toTimeZoneDateString(subMonths(baseDate, 1), timezone)); setEndDate(todayLagosStr);
    } else if (range === "3m") {
      setStartDate(toTimeZoneDateString(subMonths(baseDate, 3), timezone)); setEndDate(todayLagosStr);
    } else if (range === "6m") {
      setStartDate(toTimeZoneDateString(subMonths(baseDate, 6), timezone)); setEndDate(todayLagosStr);
    } else if (range === "1y") {
      setStartDate(toTimeZoneDateString(subYears(baseDate, 1), timezone)); setEndDate(todayLagosStr);
    }
  }, [timezone]);

  const handleSelectChange = (value: string) => {
    if (value === "") {
      const todayStr = toTimeZoneDateString(new Date(), timezone);
      setTempStartDate(startDate || todayStr);
      setTempEndDate(endDate || todayStr);
      setIsCustomModalOpen(true);
    } else {
      applyPreset(value);
    }
  };

  const handleReset = useCallback(() => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setActivePreset("all");
    setStatusFilter("all");
  }, []);

  // ── Filtering ──────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    return dailyGroups.filter(group => {
      // 1. Date range
      if (startDate && group.dateStr < startDate) return false;
      if (endDate && group.dateStr > endDate) return false;

      // 2. Status
      if (statusFilter === "approved" && !group.isFullyApproved) return false;
      if (statusFilter === "pending" && group.isFullyApproved) return false;

      // 3. Product name search — keep day if ANY product matches
      if (q) {
        const hasMatch = Object.values(group.productBreakdown).some(p =>
          p.productName.toLowerCase().includes(q)
        );
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [dailyGroups, startDate, endDate, statusFilter, q]);

  const toggleDate = useCallback((dateStr: string) => {
    setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  }, []);

  const hasActiveFilters = q || startDate || endDate || statusFilter !== "all";

  return (
    <div>
      {/* ── Sticky Filter Bar ───────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-sm border-b border-slate-200 dark:border-[#2C2C2E] px-3 lg:px-4 py-2.5 mb-2 shadow-sm lg:rounded-2xl lg:shadow-md lg:border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-2 w-full">
          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search product..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-1 focus:ring-blue-400 outline-none font-medium transition-all"
            />
          </div>

          {/* Date Preset */}
          <div className="relative shrink-0">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-500 pointer-events-none" />
            <select
              value={activePreset}
              onChange={e => handleSelectChange(e.target.value)}
              className="bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] text-gray-900 dark:text-white text-[10px] font-bold rounded-xl pl-7 pr-6 py-1.5 outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-blue-400 transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="1m">Last Month</option>
              <option value="3m">3 Months</option>
              <option value="6m">6 Months</option>
              <option value="1y">1 Year</option>
              <option value="">Custom Range</option>
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative shrink-0">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as "all" | "approved" | "pending")}
              className="bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] text-gray-900 dark:text-white text-[10px] font-bold rounded-xl pl-7 pr-6 py-1.5 outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-blue-400 transition-all"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
              hasActiveFilters
                ? "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100"
                : "text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-[#252528] hover:border-gray-200 dark:hover:border-[#2C2C2E]"
            }`}
            title="Reset Filters"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Active filter hint */}
        {hasActiveFilters && (
          <p className="text-[9px] text-blue-500 dark:text-blue-400 font-bold mt-1 pl-0.5 uppercase tracking-widest">
            {filteredGroups.length} of {dailyGroups.length} days shown
          </p>
        )}
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#1C1C1E] lg:rounded-xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E]">
            <Calendar className="mx-auto h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {hasActiveFilters ? "No results match your filters" : "No Sales History Found"}
            </h3>
            {hasActiveFilters && (
              <button onClick={handleReset} className="mt-2 text-xs text-blue-500 dark:text-blue-400 font-bold hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filteredGroups.map(group => (
            <ManagerHistoryRow
              key={group.dateStr}
              dateStr={group.dateStr}
              sessions={group.sessions}
              dailyTotalRevenue={group.dailyTotalRevenue}
              dailyTotalItems={group.dailyTotalItems}
              isFullyApproved={group.isFullyApproved}
              productBreakdown={group.productBreakdown}
              isExpanded={!!expandedDates[group.dateStr]}
              onToggle={toggleDate}
              availableProducts={availableProducts}
              searchQuery={q}
            />
          ))
        )}
      </div>

      {/* ── Custom Date Range Modal ──────────────────────────────── */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-2xl p-5 shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Select Date Range
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                <input type="date" value={tempStartDate} onChange={e => setTempStartDate(e.target.value)}
                  className="bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] text-gray-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-blue-400 w-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">End Date</label>
                <input type="date" value={tempEndDate} onChange={e => setTempEndDate(e.target.value)}
                  className="bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] text-gray-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-blue-400 w-full" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setIsCustomModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors">Cancel</button>
              <button
                onClick={() => { setStartDate(tempStartDate); setEndDate(tempEndDate); setActivePreset("custom"); setIsCustomModalOpen(false); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
              >Apply Range</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
