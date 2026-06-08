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
      className="w-full px-4 lg:px-6 py-4 flex items-center justify-between bg-white dark:bg-[#1C1C1E] hover:bg-blue-100/60 transition-colors focus:outline-none group"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${isFullyApproved ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
          {isFullyApproved ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        </div>
        <div className="text-left flex items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {format(parseISO(dateStr), "EEEE, MMMM do yyyy")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400">{sessionsCount} session(s)</p>
          </div>
          {isFullyApproved ? (
            <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>
          ) : (
            <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tighter">Revenue</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(dailyTotalRevenue)}</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tighter">Items Sold</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{dailyTotalItems.toFixed(2)}</p>
        </div>
        <div className="text-slate-400 dark:text-gray-500">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
    </button>
  );
}
