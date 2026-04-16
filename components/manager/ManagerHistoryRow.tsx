"use client";

import { useMemo, memo } from "react";
import { format, parseISO } from "date-fns";
import { Award, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import EditSaleModal from "@/components/admin/EditSaleModal";
import { useRouter } from "next/navigation";

interface ItemDetail {
  id?: string;
  productId: string;
  productName: string;
  qtySold: number;
  revenue: number;
  createdAt?: string;
  isDeleted?: boolean;
}

interface SessionSummary {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalRevenue: number;
  itemsCount: number;
  approvalStatus: string;
  items: ItemDetail[];
}

interface ManagerHistoryRowProps {
  dateStr: string;
  sessions: SessionSummary[];
  dailyTotalRevenue: number;
  dailyTotalItems: number;
  isFullyApproved: boolean;
  productBreakdown: Record<string, ItemDetail>;
  isExpanded: boolean;
  onToggle: (dateStr: string) => void;
  availableProducts: { id: string; name: string; }[];
}

const ManagerHistoryRow = memo(function ManagerHistoryRow({
  dateStr,
  sessions,
  dailyTotalRevenue,
  dailyTotalItems,
  isFullyApproved,
  productBreakdown,
  isExpanded,
  onToggle,
  availableProducts
}: ManagerHistoryRowProps) {
  const router = useRouter();

  // LAZY CALCULATIONS
  const processedData = useMemo(() => {
    if (!isExpanded) return { dailyHistoryItems: [], breakdownArray: [], topProduct: null };

    const breakdownArray = Object.values(productBreakdown).sort((a, b) => b.revenue - a.revenue);
    
    const topProduct = breakdownArray.length > 0 
      ? breakdownArray.reduce((prev, curr) => (curr.qtySold > prev.qtySold ? curr : prev))
      : null;
      
    const dailyHistoryItems = sessions.flatMap(session => 
      session.items.map(item => ({
        id: item.id || '',
        time: format(parseISO(item.createdAt || session.startedAt), "HH:mm"),
        timestamp: new Date(item.createdAt || session.startedAt).getTime(),
        productId: item.productId,
        productName: item.productName,
        qty: item.qtySold,
        revenue: item.revenue,
        isApproved: session.approvalStatus === 'approved',
        isDeleted: item.isDeleted || false
      }))
    ).sort((a, b) => a.timestamp - b.timestamp);

    return { dailyHistoryItems, breakdownArray, topProduct };
  }, [isExpanded, sessions, productBreakdown]);

  return (
    <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 overflow-hidden transition-all duration-200">
      {/* Header Toggle */}
      <button
        onClick={() => onToggle(dateStr)}
        className="w-full px-4 lg:px-6 py-4 flex items-center justify-between bg-white hover:bg-blue-100/60 transition-colors focus:outline-none group"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${isFullyApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
            {isFullyApproved ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div className="text-left flex items-center gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {format(parseISO(dateStr), "EEEE, MMMM do yyyy")}
              </h3>
              <p className="text-sm text-slate-500">{sessions.length} session(s)</p>
            </div>
            {isFullyApproved ? (
              <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>
            ) : (
              <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Revenue</p>
            <p className="text-lg font-bold text-emerald-600">₦{dailyTotalRevenue.toFixed(2)}</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Items Sold</p>
            <p className="text-lg font-bold text-slate-900">{dailyTotalItems.toFixed(2)}</p>
          </div>
          <div className="text-slate-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-in slide-in-from-top-2 duration-300">
          {/* Mobile Stats */}
          <div className="flex sm:hidden justify-between mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div>
              <p className="text-xs text-slate-500">Revenue</p>
              <p className="font-bold text-emerald-600">₦{dailyTotalRevenue.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Items Sold</p>
              <p className="font-bold text-slate-900">{dailyTotalItems.toFixed(2)}</p>
            </div>
          </div>

          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Performance Summary</h4>
          <div className="flex flex-wrap gap-2">
            {processedData.breakdownArray.map((item, idx) => (
              <div key={item.productId} className="bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2 flex items-center min-w-[140px] hover:border-blue-200 transition-colors">
                 <div className="w-full">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      {idx === 0 && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      {item.productName}
                      {item.isDeleted && <span className="text-[8px] bg-rose-500/10 text-rose-500 px-1 rounded border border-rose-500/20 font-black uppercase tracking-tighter shrink-0">Deleted</span>}
                    </p>
                    <div className="flex justify-between items-center gap-4 mt-2">
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.qtySold.toFixed(2)} qty</span>
                      <span className="text-[10px] font-black text-emerald-600">₦{item.revenue.toFixed(2)}</span>
                    </div>
                 </div>
              </div>
            ))}
            {processedData.breakdownArray.length === 0 && (
              <span className="text-xs text-slate-400 italic">No products sold in these sessions.</span>
            )}
          </div>

          {/* Transaction Log */}
          {processedData.dailyHistoryItems.length > 0 && (
            <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Log</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-white text-left">
                    <tr>
                      <th className="py-3 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">SN</th>
                      <th className="py-3 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                      <th className="py-3 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                      <th className="py-3 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                      <th className="py-3 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                      <th className="py-3 px-4 w-12 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {processedData.dailyHistoryItems.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-blue-100/30 transition-colors group">
                        <td className="py-3 px-4 text-xs text-slate-400 font-mono italic">{idx + 1}</td>
                        <td className="py-3 px-4 text-xs text-slate-500 font-medium">{entry.time}</td>
                        <td className="py-3 px-4 text-xs font-bold text-slate-900 text-left">
                          <div className="flex items-center gap-2">
                             {entry.productName}
                             {entry.isDeleted && (
                               <span className="text-[8px] bg-rose-600/20 text-rose-500 border border-rose-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Deleted</span>
                             )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 text-right font-mono">{entry.qty.toFixed(2)}</td>
                        <td className="py-3 px-4 text-xs font-black text-emerald-600 text-right">₦{entry.revenue.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">
                           {!entry.isApproved && !entry.isDeleted && (
                             <EditSaleModal
                               itemId={entry.id}
                               productId={entry.productId}
                               initialQty={entry.qty}
                               initialRevenue={entry.revenue}
                               productName={entry.productName}
                               availableProducts={availableProducts}
                               onSuccess={() => router.refresh()}
                             />
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default ManagerHistoryRow;
