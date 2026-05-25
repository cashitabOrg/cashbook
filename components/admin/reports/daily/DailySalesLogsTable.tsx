import { format, parseISO } from "date-fns";

type DailySalesLogsTableProps = {
  items: any[];
};

export default function DailySalesLogsTable({ items }: DailySalesLogsTableProps) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-200 dark:border-[#2C2C2E] overflow-hidden shadow-sm animate-in fade-in duration-300 text-left">
      <div className="overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-100 dark:divide-[#2C2C2E] text-left">
            <thead>
              <tr className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-gray-50/50 dark:bg-[#252528]/50 text-left">
                <th className="py-2 px-4 w-12 text-left">SN</th>
                <th className="py-2 px-4 text-left">Time</th>
                <th className="py-2 px-4 text-left">Manager</th>
                <th className="py-2 px-4 text-left">Product</th>
                <th className="py-2 px-4 text-right">Sold</th>
                <th className="py-2 px-4 text-right pr-6">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2C2C2E]">
              {items.map((sale, idx) => (
                <tr key={sale.id} className={`hover:bg-gray-50 dark:hover:bg-[#2C2C2E]/50 text-[11px] transition-colors ${sale.isDeleted ? 'opacity-50 grayscale' : ''}`}>
                  <td className="py-2 px-4 text-gray-400 dark:text-gray-500 font-mono italic">{idx + 1}</td>
                  <td className="py-2 px-4 text-gray-500 dark:text-gray-400 font-medium">{format(parseISO(sale.timestamp), "HH:mm")}</td>
                  <td className="py-2 px-4 font-bold text-gray-700 dark:text-gray-300">{sale.managerName}</td>
                  <td className="py-2 px-4 font-medium text-gray-900 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      {sale.productName}
                      {sale.isDeleted && (
                        <span className="text-[8px] bg-rose-50 dark:bg-rose-600/20 text-rose-600 border border-rose-200 dark:border-rose-500/30 px-1 rounded font-black uppercase tracking-tighter">Deleted</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4 text-gray-500 dark:text-gray-400 text-right font-mono">{sale.qty.toFixed(2)}</td>
                  <td className="py-2 px-4 font-black text-emerald-600 text-right pr-6">₦{sale.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
