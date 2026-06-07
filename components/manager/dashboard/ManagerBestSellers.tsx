import { TrendingUp, Maximize2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type ManagerBestSellersProps = {
  topProducts: {
    id: string;
    name: string;
    total_qty_sold: number;
    total_revenue: number;
  }[];
  onExpand: () => void;
};

export default function ManagerBestSellers({ topProducts, onExpand }: ManagerBestSellersProps) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E] overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/50 dark:bg-[#252528]/50">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Best Sellers</h3>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <button
            onClick={onExpand}
            className="p-1.5 text-slate-400 dark:text-gray-500 hover:text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
            title="Expand table"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto h-[400px] lg:max-h-[calc(100vh-320px)]">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-[#2C2C2E]">
          <thead className="bg-slate-50/80 dark:bg-[#252528]/80 sticky top-0 z-10 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
            <tr>
              <th className="py-3 px-6 text-left w-12">SN</th>
              <th className="py-3 px-6 text-left">Item Name</th>
              <th className="py-3 px-6 text-right">Sold</th>
              <th className="py-3 px-6 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-slate-100 dark:divide-[#2C2C2E]">
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-slate-400 dark:text-gray-500 font-medium italic">No sales found matching search/dates.</td>
              </tr>
            ) : (
              topProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:bg-[#252528]/50 transition-colors">
                  <td className="py-4 px-6 text-[10px] text-slate-400 dark:text-gray-500 font-mono italic">{idx + 1}</td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-900 dark:text-white">{p.name}</td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-gray-300 text-right font-mono">{p.total_qty_sold.toFixed(2)}</td>
                  <td className="py-4 px-6 text-sm text-emerald-600 dark:text-emerald-400 font-bold text-right">{formatCurrency(Number(p.total_revenue))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
