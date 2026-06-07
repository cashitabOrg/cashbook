import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type DailySalesPerformanceProps = {
  sortedPerf: { name: string; qty: number; revenue: number }[];
};

export default function DailySalesPerformance({ sortedPerf }: DailySalesPerformanceProps) {
  return (
    <div className="mb-6">
       <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
         <TrendingUp className="w-3 h-3 text-blue-500" />
         Product Performance Summary
       </h4>
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
         {sortedPerf.map((item) => (
           <div key={item.name} className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-lg p-2.5 flex flex-col justify-between hover:border-blue-500/30 transition-colors shadow-sm">
              <span className="text-[11px] font-bold text-gray-900 dark:text-gray-200 truncate mb-1" title={item.name}>{item.name}</span>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500 dark:text-gray-400 font-mono italic">{item.qty.toFixed(2)} qty</span>
                <span className="text-emerald-600 font-black">{formatCurrency(item.revenue)}</span>
              </div>
           </div>
         ))}
       </div>
    </div>
  );
}
