import { format } from "date-fns";

type AdjustmentLogTableProps = {
  recentAdjustments?: any[];
};

export default function AdjustmentLogTable({ recentAdjustments }: AdjustmentLogTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <div>
          <h3 className="text-lg font-bold text-white">Stock Adjustment Log</h3>
          <p className="text-sm text-slate-400">Most recent inventory corrections and spoilage logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-100 italic">Adjustment Archive</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950 font-bold uppercase tracking-wider text-[10px] text-slate-400">
            <tr>
              <th className="py-3 px-6 text-left w-12">SN</th>
              <th className="py-3 px-6 text-left">Time</th>
              <th className="py-3 px-6 text-left">Product</th>
              <th className="py-3 px-6 text-right">Adjustment</th>
              <th className="py-3 px-6 text-left pl-6">Reason</th>
              <th className="py-3 px-6 text-left pl-6">Admin</th>
              <th className="py-3 px-6 text-left pr-6">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-800">
            {!recentAdjustments || recentAdjustments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-500 font-medium italic">No recent adjustments found.</td>
              </tr>
            ) : (
              recentAdjustments.map((adj, idx) => (
                <tr key={adj.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 text-[10px] text-slate-600 font-mono italic">{idx + 1}</td>
                  <td className="py-4 px-6 text-xs text-slate-400">{format(new Date(adj.created_at), "MMM d, HH:mm")}</td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-200">{adj.products?.name}</td>
                  <td className={`py-4 px-6 text-sm font-black text-right ${adj.quantity_change < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {adj.quantity_change < 0 ? '-' : '+'}{Math.abs(adj.quantity_change).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-xs font-bold pl-6">
                    <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md uppercase tracking-tighter border border-slate-700 shadow-sm">{adj.reason}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-300 pl-6 font-medium">{adj.users?.full_name || "Admin"}</td>
                  <td className="py-4 px-6 text-[11px] text-slate-400 italic pr-6 truncate max-w-[200px]">{adj.note || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
