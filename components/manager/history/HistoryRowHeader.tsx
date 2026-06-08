import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type HistoryRowHeaderProps = {
  dateStr: string;
  sessionsCount: number;
  dailyTotalRevenue: number;
  dailyTotalItems: number;
  isFullyApproved: boolean;
  isExpanded: boolean;
  onToggle: (date: string) => void;
};

export default function HistoryRowHeader({
  dateStr,
  sessionsCount,
  dailyTotalRevenue,
  dailyTotalItems,
  isFullyApproved,
  isExpanded,
  onToggle
}: HistoryRowHeaderProps) {
  return (
    <button
      onClick={() => onToggle(dateStr)}
      className="w-full px-3 lg:px-5 py-3 flex items-center justify-between bg-white dark:bg-[#1C1C1E] hover:bg-blue-100/60 transition-colors focus:outline-none group"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-1.5 rounded-lg shrink-0 ${isFullyApproved ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
          {isFullyApproved ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        </div>
        <div className="text-left flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {format(parseISO(dateStr), "EEE, MMM do yyyy")}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-gray-400">{sessionsCount} session(s)</p>
          </div>
          {isFullyApproved ? (
            <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1 shrink-0"><CheckCircle2 className="w-2.5 h-2.5"/> Approved</span>
          ) : (
            <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1 shrink-0"><Clock className="w-2.5 h-2.5"/> Pending</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden sm:block text-right">
          <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tighter">Revenue</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(dailyTotalRevenue)}</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tighter">Items Sold</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{dailyTotalItems.toFixed(2)}</p>
        </div>
        <div className="text-slate-400 dark:text-gray-500">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
    </button>
  );
}
