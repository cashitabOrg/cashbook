import { TrendingUp, Maximize2 } from "lucide-react";

type PerformanceTableProps = {
  topProducts: {
    id: string;
    name: string;
    total_qty_sold: number;
    total_revenue: number;
  }[];
  onExpand: () => void;
};

export default function PerformanceTable({ topProducts, onExpand }: PerformanceTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[450px]">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <div>
          <h3 className="text-lg font-bold text-white">Performance Index</h3>
          <p className="text-sm text-white">Sales breakdown for selected range.</p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <button
            onClick={onExpand}
            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
            title="Expand table"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950 sticky top-0 z-10 font-bold uppercase tracking-wider text-[10px] text-white">
            <tr>
              <th className="py-3 px-6 text-left w-12">SN</th>
              <th className="py-3 px-6 text-left">Product Name</th>
              <th className="py-3 px-6 text-right">Units Sold</th>
              <th className="py-3 px-6 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-800">
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-white font-medium italic">No sales found matching search/dates.</td>
              </tr>
            ) : (
              topProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 text-[10px] text-white font-mono italic">{idx + 1}</td>
                  <td className="py-4 px-6 text-sm font-bold text-white">{p.name}</td>
                  <td className="py-4 px-6 text-sm text-white text-right font-mono">{p.total_qty_sold.toFixed(2)}</td>
                  <td className="py-4 px-6 text-sm text-emerald-400 font-bold text-right">₦{Number(p.total_revenue).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
