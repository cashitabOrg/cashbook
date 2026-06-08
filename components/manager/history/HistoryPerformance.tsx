import { Award } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type HistoryPerformanceProps = {
  breakdownArray: any[];
};

export default function HistoryPerformance({ breakdownArray }: HistoryPerformanceProps) {
  return (
    <>
      <h4 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">Performance Summary</h4>
      <div className="flex flex-wrap gap-2">
        {breakdownArray.map((item, idx) => (
          <div key={item.productId} className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] shadow-sm rounded-lg px-3 py-2 flex items-center min-w-[140px] hover:border-blue-200 transition-colors">
             <div className="w-full">
                <p className="text-xs font-bold text-slate-800 dark:text-gray-200 flex items-center gap-1.5 truncate">
                  {idx === 0 && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  {item.productName}
                  {item.isDeleted && <span className="text-[8px] bg-rose-500/10 text-rose-500 px-1 rounded border border-rose-500/20 font-black uppercase tracking-tighter shrink-0">Deleted</span>}
                </p>
                <div className="flex justify-between items-center gap-4 mt-2">
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{item.qtySold.toFixed(2)} qty</span>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(item.revenue)}</span>
                </div>
             </div>
          </div>
        ))}
        {breakdownArray.length === 0 && (
          <span className="text-xs text-slate-400 dark:text-gray-500 italic">No products sold in these sessions.</span>
        )}
      </div>
    </>
  );
}
