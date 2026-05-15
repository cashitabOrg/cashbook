type DailySalesIntelTableProps = {
  sortedIntel: any[];
};

export default function DailySalesIntelTable({ sortedIntel }: DailySalesIntelTableProps) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
           <thead>
              <tr className="bg-slate-900/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-2.5 px-4 text-left">Product</th>
                <th className="py-2.5 px-4 text-right">Qty Sold</th>
                <th className="py-2.5 px-4 text-right">Selling Price</th>
                <th className="py-2.5 px-4 text-right">Manager Sales</th>
                <th className="py-2.5 px-4 text-right pr-6">Audited Variance</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-800">
              {sortedIntel.map((stats) => (
                <tr key={stats.name} className="text-[11px] hover:bg-slate-700/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-200">{stats.name}</td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono">{stats.qty.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-500 font-mono italic">₦{stats.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-200">₦{stats.recordedRevenue.toFixed(2)}</td>
                  <td className={`py-3 px-4 text-right font-black pr-6 ${stats.variance < -1 ? 'text-rose-600' : stats.variance > 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
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
