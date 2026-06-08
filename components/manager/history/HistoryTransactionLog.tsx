import EditSaleModal from "@/components/admin/EditSaleModal";
import { formatCurrency } from "@/lib/format";

type HistoryTransactionLogProps = {
  dailyHistoryItems: any[];
  availableProducts: { id: string; name: string; }[];
  onSuccess: () => void;
};

export default function HistoryTransactionLog({
  dailyHistoryItems,
  availableProducts,
  onSuccess
}: HistoryTransactionLogProps) {
  if (dailyHistoryItems.length === 0) return null;

  return (
    <div className="mt-6 border border-slate-200 dark:border-[#2C2C2E] rounded-lg overflow-hidden bg-white dark:bg-[#1C1C1E] shadow-sm">
      <div className="px-4 py-3 bg-slate-50 dark:bg-[#252528] border-b border-slate-200 dark:border-[#2C2C2E]">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Transaction Log</h4>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full divide-y divide-slate-100 dark:divide-[#2C2C2E] table-fixed">
          <thead className="bg-white dark:bg-[#1C1C1E] text-left">
            <tr>
              <th className="py-2.5 px-2 text-center text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest w-7">SN</th>
              <th className="py-2.5 px-2 text-left text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest w-14">Time</th>
              <th className="py-2.5 px-2 text-left text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Item</th>
              <th className="py-2.5 px-2 text-right text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest w-14">Qty</th>
              <th className="py-2.5 px-2 text-right text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest w-24">Total</th>
              <th className="py-2.5 px-1 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-[#2C2C2E]">
            {dailyHistoryItems.map((entry, idx) => (
              <tr key={idx} className="hover:bg-blue-100/30 dark:hover:bg-blue-500/5 transition-colors group">
                <td className="py-2 px-2 text-[10px] text-slate-400 dark:text-gray-500 font-mono italic text-center">{idx + 1}</td>
                <td className="py-2 px-2 text-[10px] text-slate-500 dark:text-gray-400 font-medium">{entry.time}</td>
                <td className="py-2 px-2 text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="truncate">{entry.productName}</span>
                    {entry.isDeleted && (
                      <span className="text-[8px] bg-rose-600/20 text-rose-500 border border-rose-500/30 px-1 py-0.5 rounded font-black uppercase tracking-tighter shrink-0">Del</span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2 text-[11px] text-slate-600 dark:text-gray-300 text-right font-mono">{entry.qty.toFixed(2)}</td>
                <td className="py-2 px-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 text-right">{formatCurrency(entry.revenue)}</td>
                <td className="py-2 px-1 text-right">
                   {!entry.isApproved && !entry.isDeleted && (
                     <EditSaleModal
                       itemId={entry.id}
                       productId={entry.productId}
                       initialQty={entry.qty}
                       initialRevenue={entry.revenue}
                       productName={entry.productName}
                       availableProducts={availableProducts}
                       onSuccess={onSuccess}
                     />
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
