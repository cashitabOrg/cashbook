import { formatCurrency } from "@/lib/format";
type DailySalesIntelTableProps = {
  sortedIntel: any[];
};

export default function DailySalesIntelTable({ sortedIntel }: DailySalesIntelTableProps) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-[#2C2C2E]">
           <thead>
              <tr className="bg-gray-50/50 dark:bg-[#252528]/50 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                <th className="py-2.5 px-4 text-left">Product</th>
                <th className="py-2.5 px-4 text-right">Qty Sold</th>
                <th className="py-2.5 px-4 text-right">Selling Price</th>
                <th className="py-2.5 px-4 text-right">Manager Sales</th>
                <th className="py-2.5 px-4 text-right pr-6">Audited Variance</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 dark:divide-[#2C2C2E]">
              {sortedIntel.map((stats) => (
                <tr key={stats.name} className="text-[11px] hover:bg-gray-50 dark:hover:bg-[#2C2C2E]/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-200">{stats.name}</td>
                  <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400 font-mono">{stats.qty.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-400 dark:text-gray-500 font-mono italic">{formatCurrency(stats.unitPrice)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-gray-200">{formatCurrency(stats.recordedRevenue)}</td>
                  <td className={`py-3 px-4 text-right font-black pr-6 ${stats.variance < -1 ? 'text-rose-600' : stats.variance > 1 ? 'text-emerald-600' : 'text-gray-400 dark:text-gray-500'}`}>
                    {stats.variance < -1 ? `-₦${Math.abs(stats.variance).toFixed(2)}` : stats.variance > 1 ? `+₦${stats.variance.toFixed(2)}` : 'MATCH'}
                  </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}
