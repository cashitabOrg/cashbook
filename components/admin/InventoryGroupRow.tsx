"use client";

import { useMemo, memo } from "react";
import { format, parseISO } from "date-fns";
import { ChevronRight, Calendar, Package, PackagePlus, Scale } from "lucide-react";

interface InventoryGroupRowProps {
  groupKey: string;
  data: {
    items: any[];
    totalAdded: number;
    netAdjusted: number;
  };
  isExpanded: boolean;
  onToggle: (key: string) => void;
  inventoryGrouping: "day" | "product";
}

const InventoryGroupRow = memo(function InventoryGroupRow({
  groupKey,
  data,
  isExpanded,
  onToggle,
  inventoryGrouping
}: InventoryGroupRowProps) {
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200 mb-4">
      <button
        onClick={() => onToggle(groupKey)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-transparent data-[expanded=true]:border-slate-100"
        data-expanded={isExpanded}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${inventoryGrouping === 'day' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600'}`}>
            {inventoryGrouping === 'day' ? <Calendar className="w-5 h-5" /> : <Package className="w-5 h-5" />}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-900">
               {inventoryGrouping === 'day' ? format(parseISO(groupKey), "EEEE, MMM do yyyy") : groupKey}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {data.items.length} activities recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <div className="hidden md:flex items-center gap-4 text-right">
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Added</p>
                <span className="text-[10px] font-black text-emerald-600">+{data.totalAdded.toFixed(2)}</span>
             </div>
             <div className="h-4 border-l border-slate-200 mx-2" />
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Net Adj.</p>
                <span className={`text-[10px] font-black ${data.netAdjusted < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                  {data.netAdjusted > 0 ? '+' : ''}{data.netAdjusted.toFixed(2)}
                </span>
             </div>
          </div>
          <div className="text-slate-400">
             <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-2 lg:p-4 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50/50 text-left">
                    <th className="py-2.5 px-4 w-12 text-left">SN</th>
                    <th className="py-2.5 px-4 w-24 text-left">Time</th>
                    <th className="py-2.5 px-4 text-left">Action</th>
                    {inventoryGrouping === 'day' && <th className="py-2.5 px-4 text-left">Product</th>}
                    <th className="py-2.5 px-4 text-right">Qty</th>
                    <th className="py-2.5 px-4 text-right">Value/Reason</th>
                    <th className="py-2.5 px-4 pl-6 text-left">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-left text-xs">
                  {data.items.map((item, idx) => (
                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${item.type === 'adjustment' ? 'bg-amber-50/20' : ''}`}>
                      <td className="py-2.5 px-4 text-slate-400 font-mono italic">{idx + 1}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-medium">
                        {format(parseISO(item.timestamp), inventoryGrouping === 'product' ? "MMM do, HH:mm" : "HH:mm")}
                      </td>
                      <td className="py-2.5 px-4">
                        {item.type === 'restock' ? (
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 w-fit uppercase tracking-tighter">
                             <PackagePlus className="w-3 h-3" /> Restock
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 w-fit uppercase tracking-tighter">
                             <Scale className="w-3 h-3" /> Adjustment
                          </span>
                        )}
                      </td>
                      {inventoryGrouping === 'day' && <td className="py-2.5 px-4 font-bold text-slate-900">{item.productName}</td>}
                      <td className={`py-2.5 px-4 text-right font-black ${item.type === 'restock' || (item.qtyChange && item.qtyChange > 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.type === 'restock' ? `+${item.qtyAdded.toFixed(2)}` : (item.qtyChange > 0 ? `+${item.qtyChange.toFixed(2)}` : `${item.qtyChange.toFixed(2)}`)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                         {item.type === 'restock' ? (
                           <span className="font-mono text-blue-600 font-bold">₦{item.totalCost.toLocaleString()}</span>
                         ) : (
                           <span className="text-slate-500 italic bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{item.reason}</span>
                         )}
                      </td>
                      <td className="py-2.5 px-4 pl-6 text-slate-600 font-medium text-left">{item.addedBy || item.adjustedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default InventoryGroupRow;
