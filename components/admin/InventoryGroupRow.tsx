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
    <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-xl shadow-sm overflow-hidden transition-all duration-200 mb-4">
      <button
        onClick={() => onToggle(groupKey)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#252528] transition-colors border-b border-transparent data-[expanded=true]:border-gray-100 dark:data-[expanded=true]:border-[#2C2C2E]"
        data-expanded={isExpanded}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${inventoryGrouping === 'day' ? 'bg-gray-100 dark:bg-[#252528] text-gray-600 dark:text-gray-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500'}`}>
            {inventoryGrouping === 'day' ? <Calendar className="w-5 h-5" /> : <Package className="w-5 h-5" />}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
               {inventoryGrouping === 'day' ? format(parseISO(groupKey), "EEEE, MMM do yyyy") : groupKey}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
              {data.items.length} activities recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <div className="hidden md:flex items-center gap-4 text-right">
             <div>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Total Added</p>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500">+{data.totalAdded.toFixed(2)}</span>
             </div>
             <div className="h-4 border-l border-gray-200 dark:border-[#3A3A3C] mx-2" />
             <div>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Net Adj.</p>
                <span className={`text-[10px] font-black ${data.netAdjusted < 0 ? 'text-rose-600 dark:text-rose-500' : 'text-blue-600 dark:text-blue-500'}`}>
                  {data.netAdjusted > 0 ? '+' : ''}{data.netAdjusted.toFixed(2)}
                </span>
             </div>
          </div>
          <div className="text-gray-400 dark:text-gray-500">
             <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-2 lg:p-4 bg-gray-50 dark:bg-[#1C1C1E] animate-in slide-in-from-top-2 duration-300">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-200 dark:border-[#2C2C2E] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-[#2C2C2E]">
                <thead>
                  <tr className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-[#252528] text-left">
                    <th className="py-2.5 px-4 w-12 text-left">SN</th>
                    <th className="py-2.5 px-4 w-24 text-left">Time</th>
                    <th className="py-2.5 px-4 text-left">Action</th>
                    {inventoryGrouping === 'day' && <th className="py-2.5 px-4 text-left">Product</th>}
                    <th className="py-2.5 px-4 text-right">Qty</th>
                    <th className="py-2.5 px-4 text-right">Value/Reason</th>
                    <th className="py-2.5 px-4 pl-6 text-left">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#2C2C2E] text-left text-xs bg-white dark:bg-[#1C1C1E]">
                  {data.items.map((item, idx) => (
                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-[#252528] transition-colors ${item.type === 'adjustment' ? 'bg-amber-50 dark:bg-amber-500/10' : ''}`}>
                      <td className="py-2.5 px-4 text-gray-500 dark:text-gray-400 font-mono italic">{idx + 1}</td>
                      <td className="py-2.5 px-4 text-gray-500 dark:text-gray-400 font-medium">
                        {format(parseISO(item.timestamp), inventoryGrouping === 'product' ? "MMM do, HH:mm" : "HH:mm")}
                      </td>
                      <td className="py-2.5 px-4">
                        {item.type === 'restock' ? (
                          <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 w-fit uppercase tracking-tighter">
                             <PackagePlus className="w-3 h-3" /> Restock
                          </span>
                        ) : (
                          <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 w-fit uppercase tracking-tighter">
                             <Scale className="w-3 h-3" /> Adjustment
                          </span>
                        )}
                      </td>
                      {inventoryGrouping === 'day' && <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white">{item.productName}</td>}
                      <td className={`py-2.5 px-4 text-right font-black ${item.type === 'restock' || (item.qtyChange && item.qtyChange > 0) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {item.type === 'restock' ? `+${item.qtyAdded.toFixed(2)}` : (item.qtyChange > 0 ? `+${item.qtyChange.toFixed(2)}` : `${item.qtyChange.toFixed(2)}`)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                         {item.type === 'restock' ? (
                           <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">₦{item.totalCost.toLocaleString()}</span>
                         ) : (
                           <span className="text-gray-500 dark:text-gray-400 italic bg-gray-100 dark:bg-[#252528] px-1.5 py-0.5 rounded text-[10px]">{item.reason}</span>
                         )}
                      </td>
                      <td className="py-2.5 px-4 pl-6 text-gray-600 dark:text-gray-300 font-medium text-left">{item.addedBy || item.adjustedBy}</td>
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
