import { Maximize2 } from "lucide-react";

type Product = {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
};

type ManagerStockLevelsProps = {
  filteredInventory: Product[];
  onExpand: () => void;
};

export default function ManagerStockLevels({ filteredInventory, onExpand }: ManagerStockLevelsProps) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] lg:rounded-2xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E] overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/50 dark:bg-[#252528]/50">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Stock Levels</h3>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <button
            onClick={onExpand}
            className="p-1.5 text-slate-400 dark:text-gray-500 hover:text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
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
              <th className="py-3 px-6 text-left">Item</th>
              <th className="py-3 px-6 text-right">Count</th>
              <th className="py-3 px-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-slate-100 dark:divide-[#2C2C2E]">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-slate-400 dark:text-gray-500 font-medium italic">No products found matching search.</td>
              </tr>
            ) : (
              filteredInventory.map((p, idx) => {
                const isLow = p.quantity < p.min_quantity;
                return (
                  <tr key={p.id} className={`transition-colors hover:bg-slate-50/50 dark:bg-[#252528]/50 ${isLow ? 'bg-red-50/30 dark:bg-red-500/10' : ''}`}>
                    <td className="py-4 px-6 text-[10px] text-slate-400 dark:text-gray-500 font-mono italic">{idx + 1}</td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-4 px-6 text-sm text-right">
                      <span className={`font-mono font-bold ${isLow ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-gray-300'}`}>{p.quantity.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {isLow ? (
                        <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded uppercase tracking-tighter italic">Low</span>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded uppercase tracking-tighter">Ok</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
