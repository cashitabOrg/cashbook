import { Award, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type HistoryPerformanceProps = {
  breakdownArray: any[];
};

export default function HistoryPerformance({ breakdownArray }: HistoryPerformanceProps) {
  if (breakdownArray.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-gray-500 italic mb-3">No products sold in these sessions.</p>
    );
  }

  return (
    <div className="mb-3">
      <h4 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Performance Summary</h4>
      {/* Horizontal scrolling card strip — matches admin dashboard MetricsBar style */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {breakdownArray.map((item, idx) => (
          <div
            key={item.productId}
            className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl p-2.5 flex flex-col gap-1.5 min-w-[130px] shrink-0 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
          >
            {/* Icon + rank */}
            <div className="flex items-center gap-1.5">
              <div className={`p-1.5 rounded-lg shrink-0 ${idx === 0 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                {idx === 0
                  ? <Award className="w-3.5 h-3.5 text-amber-500" />
                  : <TrendingUp className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                }
              </div>
              <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                {idx === 0 ? 'Top Seller' : `#${idx + 1}`}
              </span>
              {item.isDeleted && (
                <span className="text-[8px] bg-rose-500/10 text-rose-500 px-1 rounded border border-rose-500/20 font-black uppercase tracking-tighter">Del</span>
              )}
            </div>
            {/* Product name */}
            <p className="text-xs font-bold text-slate-800 dark:text-gray-200 leading-snug truncate">{item.productName}</p>
            {/* Qty */}
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Qty Sold</p>
              <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{item.qtySold.toFixed(2)}</p>
            </div>
            {/* Revenue */}
            <div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Revenue</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(item.revenue)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
