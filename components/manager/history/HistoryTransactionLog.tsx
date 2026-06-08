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
        <table className="min-w-full divide-y divide-slate-100 dark:divide-[#2C2C2E]">
          <thead className="bg-white dark:bg-[#1C1C1E] text-left">
            <tr>
              <th className="py-3 px-4 text-left text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest w-12">SN</th>
              <th className="py-3 px-4 text-left text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Time</th>
              <th className="py-3 px-4 text-left text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Item</th>
              <th className="py-3 px-4 text-right text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Qty</th>
              <th className="py-3 px-4 text-right text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Total</th>
              <th className="py-3 px-4 w-12 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {dailyHistoryItems.map((entry, idx) => (
              <tr key={idx} className="hover:bg-blue-100/30 transition-colors group">
                <td className="py-3 px-4 text-xs text-slate-400 dark:text-gray-500 font-mono italic">{idx + 1}</td>
                <td className="py-3 px-4 text-xs text-slate-500 dark:text-gray-400 font-medium">{entry.time}</td>
                <td className="py-3 px-4 text-xs font-bold text-slate-900 dark:text-white text-left">
                  <div className="flex items-center gap-2">
                     {entry.productName}
                     {entry.isDeleted && (
                       <span className="text-[8px] bg-rose-600/20 text-rose-500 border border-rose-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Deleted</span>
                     )}
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-600 dark:text-gray-300 text-right font-mono">{entry.qty.toFixed(2)}</td>
                <td className="py-3 px-4 text-xs font-black text-emerald-600 dark:text-emerald-400 text-right">{formatCurrency(entry.revenue)}</td>
                <td className="py-3 px-4 text-right">
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
