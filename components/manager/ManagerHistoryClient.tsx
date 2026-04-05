"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, Calendar, ShoppingCart, DollarSign, Award, CheckCircle2, Clock } from "lucide-react";
import EditSaleModal from "@/components/admin/EditSaleModal";
import { useRouter } from "next/navigation";

type ItemDetail = {
  id?: string;
  productId: string;
  productName: string;
  qtySold: number;
  revenue: number;
  createdAt?: string;
};

type SessionSummary = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalRevenue: number;
  itemsCount: number;
  approvalStatus: string;
  items: ItemDetail[];
};

type DailyGroup = {
  dateStr: string;
  sessions: SessionSummary[];
  dailyTotalRevenue: number;
  dailyTotalItems: number;
  isFullyApproved: boolean;
  productBreakdown: Record<string, ItemDetail>;
};

export default function ManagerHistoryClient({
  dailyGroups,
  availableProducts = [],
}: {
  dailyGroups: DailyGroup[];
  availableProducts?: { id: string; name: string; }[];
}) {
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
    // Expand the first date by default
    dailyGroups.length > 0 ? { [dailyGroups[0].dateStr]: true } : {}
  );

  const router = useRouter();

  const toggleDate = (dateStr: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  return (
    <div className="space-y-6">
      {dailyGroups.length === 0 ? (
        <div className="text-center py-12 bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200">
          <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-medium text-slate-900">No Sales History</h3>
          <p className="mt-1 text-sm text-slate-500">Sales sessions will appear here once completed.</p>
        </div>
      ) : (
        dailyGroups.map((group) => {
          const isExpanded = expandedDates[group.dateStr];
          
          // Determine top selling product logically
          const breakdownArray = Object.values(group.productBreakdown);
          const topProduct = breakdownArray.length > 0 
            ? breakdownArray.reduce((prev, curr) => (curr.qtySold > prev.qtySold ? curr : prev))
            : null;
            
          const dailyHistoryItems = group.sessions.flatMap(session => 
            session.items.map(item => ({
              id: item.id || '',
              time: format(parseISO(item.createdAt || session.startedAt), "HH:mm"),
              productId: item.productId,
              productName: item.productName,
              qty: item.qtySold,
              revenue: item.revenue,
              isApproved: session.approvalStatus === 'approved'
            }))
          ).sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div key={group.dateStr} className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 overflow-hidden transition-all duration-200">
              {/* Header Toggle */}
              <button
                onClick={() => toggleDate(group.dateStr)}
                className="w-full px-4 lg:px-6 py-4 flex items-center justify-between bg-white hover:bg-blue-100/60 transition-colors focus:outline-none group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${group.isFullyApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    {group.isFullyApproved ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>
                  <div className="text-left flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {format(parseISO(group.dateStr), "EEEE, MMMM do yyyy")}
                      </h3>
                      <p className="text-sm text-slate-500">{group.sessions.length} session(s)</p>
                    </div>
                    {group.isFullyApproved ? (
                      <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-500">Revenue</p>
                    <p className="text-lg font-bold text-emerald-600">₦{group.dailyTotalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-500">Items Sold</p>
                    <p className="text-lg font-bold text-slate-900">{group.dailyTotalItems.toFixed(2)}</p>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </button>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                  {/* Mobile Stats (only visible on small screens) */}
                  <div className="flex sm:hidden justify-between mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div>
                      <p className="text-xs text-slate-500">Revenue</p>
                      <p className="font-bold text-emerald-600">₦{group.dailyTotalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Items Sold</p>
                      <p className="font-bold text-slate-900">{group.dailyTotalItems.toFixed(2)}</p>
                    </div>
                  </div>

                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Performance Summary</h4>
                  <div className="flex flex-wrap gap-2">
                    {breakdownArray
                      .sort((a, b) => b.revenue - a.revenue)
                      .map((item, idx) => (
                        <div key={item.productId} className="bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2 flex items-center min-w-[140px] hover:border-blue-200 transition-colors">
                           <div className="w-full">
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                                {idx === 0 && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                {item.productName}
                              </p>
                              <div className="flex justify-between items-center gap-4 mt-2">
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.qtySold.toFixed(2)} qty</span>
                                <span className="text-[10px] font-black text-emerald-600">₦{item.revenue.toFixed(2)}</span>
                              </div>
                           </div>
                        </div>
                      ))}
                      {breakdownArray.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No products sold in these sessions.</span>
                      )}
                  </div>

                  {/* Transaction Log */}
                  {dailyHistoryItems.length > 0 && (
                    <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Log</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                          <thead className="bg-white">
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
                            {dailyHistoryItems.map((entry, idx) => (
                              <tr key={idx} className="hover:bg-blue-100/60 transition-colors cursor-pointer group">
                                <td className="py-3 px-4 text-xs text-slate-400 font-mono italic">{idx + 1}</td>
                                <td className="py-3 px-4 text-xs text-slate-500 font-medium">{entry.time}</td>
                                <td className="py-3 px-4 text-xs font-bold text-slate-900">{entry.productName}</td>
                                <td className="py-3 px-4 text-xs text-slate-600 text-right font-mono">{entry.qty.toFixed(2)}</td>
                                <td className="py-3 px-4 text-xs font-black text-emerald-600 text-right">₦{entry.revenue.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right">
                                   {!entry.isApproved && (
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
        })
      )}
    </div>
  );
}
