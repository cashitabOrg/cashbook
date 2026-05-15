import { Maximize2 } from "lucide-react";

type Product = {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  unit: string;
};

type InventoryMonitorTableProps = {
  filteredInventory: Product[];
  onExpand: () => void;
};

export default function InventoryMonitorTable({ filteredInventory, onExpand }: InventoryMonitorTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[450px]">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <div>
          <h3 className="text-lg font-bold text-white">Inventory Monitor</h3>
          <span className="text-xs font-bold text-white">Live Status</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-tighter border border-emerald-500/30">Live</span>
          <button
            onClick={onExpand}
            className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
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
              <th className="py-3 px-6 text-left">Product</th>
              <th className="py-3 px-6 text-right">Stock</th>
              <th className="py-3 px-6 text-center">Health</th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-800">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-white font-medium italic">No products found matching search.</td>
              </tr>
            ) : (
              filteredInventory.map((p, idx) => {
                const isLow = p.quantity < p.min_quantity;
                return (
                  <tr key={p.id} className={`transition-colors hover:bg-slate-800/30 ${isLow ? 'bg-red-500/5' : ''}`}>
                    <td className="py-4 px-6 text-[10px] text-white font-mono italic">{idx + 1}</td>
                    <td className="py-4 px-6 text-sm font-bold text-white">{p.name}</td>
                    <td className="py-4 px-6 text-sm text-right">
                      <span className={`font-mono font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>{p.quantity.toFixed(2)}</span>
                      <span className="text-white text-[10px] ml-1 uppercase">{p.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-[10px] font-bold text-red-400 uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            Urgent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-400 uppercase">
                            Healthy
                        </span>
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
