import { TrendingUp, Maximize2 } from "lucide-react";

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
    <div className="bg-white lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Best Sellers</h3>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <button
            onClick={onExpand}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Expand table"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto h-[400px] lg:max-h-[calc(100vh-320px)]">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80 sticky top-0 z-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="py-3 px-6 text-left w-12">SN</th>
              <th className="py-3 px-6 text-left">Item Name</th>
              <th className="py-3 px-6 text-right">Sold</th>
              <th className="py-3 px-6 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-slate-400 font-medium italic">No sales found matching search/dates.</td>
              </tr>
            ) : (
              topProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-[10px] text-slate-400 font-mono italic">{idx + 1}</td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-900">{p.name}</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-right font-mono">{p.total_qty_sold.toFixed(2)}</td>
                  <td className="py-4 px-6 text-sm text-emerald-600 font-bold text-right">₦{Number(p.total_revenue).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
