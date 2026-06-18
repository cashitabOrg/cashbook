import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type SalesSummaryBarProps = {
  totalItems: number;
  totalRevenue: number;
  pendingSyncCount: number;
  isEnding: boolean;
  handleEndSession: () => void;
};

export default function SalesSummaryBar({
  totalItems,
  totalRevenue,
  pendingSyncCount,
  isEnding,
  handleEndSession
}: SalesSummaryBarProps) {
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  useEffect(() => {
    if (pendingSyncCount === 0) {
      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [pendingSyncCount]);

  return (
    <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-sm shadow-sm border-b border-slate-200 dark:border-[#2C2C2E] lg:rounded-xl lg:shadow-md lg:border lg:mb-6 isolate">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Metrics + End Session row */}
      <div className="relative z-10 flex flex-row justify-between items-center gap-3 px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex flex-col gap-1 min-w-0">
          {/* Total Items + Session Revenue inline */}
          <div className="flex flex-row items-center gap-3 sm:gap-5 flex-nowrap whitespace-nowrap">
            <div className="flex items-baseline gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Total Items</span>
              <span className="text-xs sm:text-lg font-black text-slate-900 dark:text-white leading-none">{Number.isInteger(totalItems) ? totalItems : totalItems.toFixed(2)}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Session Revenue</span>
              <span className="text-xs sm:text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
          {/* Sync Status */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-gray-500 font-light tracking-tight">
            {pendingSyncCount > 0 ? (
              <>
                <RefreshCw className="w-3 h-3 text-blue-500 dark:text-blue-400 animate-spin shrink-0" />
                <span>Sync Status: <span className="font-normal text-blue-500 dark:text-blue-400">Saving & syncing {pendingSyncCount} items... (Pending)</span></span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>Sync Status: <span className="font-normal text-emerald-600 dark:text-emerald-400">Cloud Synced (Up to date {lastSyncedTime ? `at ${lastSyncedTime}` : ''})</span></span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleEndSession}
          disabled={isEnding}
          className="relative z-10 inline-flex items-center rounded-xl bg-blue-600 px-3 py-2 sm:px-6 sm:py-3 text-[10px] sm:text-xs font-black text-white shadow-lg hover:bg-blue-700 transition-all active:scale-95 gap-1.5 uppercase tracking-widest disabled:opacity-50 shrink-0"
        >
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          {isEnding ? "Submitting..." : "Submit"}
        </button>
      </div>

      {/* Column Headers — inside the same sticky container, mobile only */}
      <div
        className="md:hidden grid items-center border-t border-slate-100 dark:border-[#2C2C2E] bg-slate-50/80 dark:bg-[#252528]/80 px-3 py-2 gap-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
        style={{ gridTemplateColumns: "4.2fr 3.3fr 3.5fr 1.2fr" }}
      >
        <div className="text-left pl-1">Product</div>
        <div className="text-right">Qty Sold</div>
        <div className="text-right">Total Price</div>
        <div></div>
      </div>
    </div>
  );
}
