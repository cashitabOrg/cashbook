import { CheckCircle2, RefreshCw, ShoppingCart } from "lucide-react";

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
  return (
    <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 p-4 lg:p-6 mb-2 lg:mb-6 flex flex-wrap gap-4 justify-between items-center isolate relative overflow-hidden shrink-0 border-b border-slate-100">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex gap-4 lg:gap-8 items-center">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Items</p>
          <p className="text-xl lg:text-2xl font-black text-slate-900 leading-none">{totalItems.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Session Revenue</p>
          <p className="text-xl lg:text-2xl font-black text-emerald-600 leading-none">₦{totalRevenue.toFixed(2)}</p>
        </div>
        
        {/* SYNC STATUS BADGE */}
        <div className="h-10 w-px bg-slate-100 mx-2 hidden sm:block" />
        
        <div className="flex flex-col">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Sync Status</p>
          {pendingSyncCount > 0 ? (
            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 animate-pulse transition-all">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-tight">{pendingSyncCount} Items Syncing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 transition-all">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-tight">Cloud Synced</span>
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={handleEndSession}
        disabled={isEnding}
        className="relative z-10 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 sm:px-6 sm:py-3 text-[10px] sm:text-xs font-black text-white shadow-lg hover:bg-slate-800 transition-all active:scale-95 gap-2 uppercase tracking-widest disabled:opacity-50"
      >
        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
        {isEnding ? "Ending..." : "End Session"}
      </button>
    </div>
  );
}
