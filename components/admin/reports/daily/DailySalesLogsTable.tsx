import { format, parseISO } from "date-fns";

type DailySalesLogsTableProps = {
  items: any[];
};

export default function DailySalesLogsTable({ items }: DailySalesLogsTableProps) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm animate-in fade-in duration-300 text-left">
      <div className="overflow-x-auto">
         <table className="min-w-full divide-y divide-slate-800 text-left">
            <thead>
              <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-900/50 text-left">
                <th className="py-2 px-4 w-12 text-left">SN</th>
                <th className="py-2 px-4 text-left">Time</th>
                <th className="py-2 px-4 text-left">Manager</th>
                <th className="py-2 px-4 text-left">Product</th>
                <th className="py-2 px-4 text-right">Sold</th>
                <th className="py-2 px-4 text-right pr-6">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((sale, idx) => (
                <tr key={sale.id} className={`hover:bg-slate-700/50 text-[11px] transition-colors ${sale.isDeleted ? 'opacity-50 grayscale' : ''}`}>
                  <td className="py-2 px-4 text-slate-500 font-mono italic">{idx + 1}</td>
                  <td className="py-2 px-4 text-slate-400 font-medium">{format(parseISO(sale.timestamp), "HH:mm")}</td>
                  <td className="py-2 px-4 font-bold text-slate-300">{sale.managerName}</td>
                  <td className="py-2 px-4 font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      {sale.productName}
                      {sale.isDeleted && (
                        <span className="text-[8px] bg-rose-600/20 text-rose-500 border border-rose-500/30 px-1 rounded font-black uppercase tracking-tighter">Deleted</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4 text-slate-400 text-right font-mono">{sale.qty.toFixed(2)}</td>
                  <td className="py-2 px-4 font-black text-emerald-600 text-right pr-6">₦{sale.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
