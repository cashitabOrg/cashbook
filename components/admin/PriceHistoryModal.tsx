"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { getPriceHistory } from "@/app/actions/products";
import { X, History, TrendingUp, PackagePlus, Clock, Scale } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";

type PriceHistoryModalProps = {
  productId: string | null;
  onClose: () => void;
};

export default function PriceHistoryModal({ productId, onClose }: PriceHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ priceLogs: any[]; restockLogs: any[]; adjustmentLogs: any[] } | null>(null);

  useEffect(() => {
    if (productId) {
      setLoading(true);
      getPriceHistory(productId).then((res) => {
        setData(res);
        setLoading(false);
      });
    }
  }, [productId]);

  if (!productId) return null;

  return (
    <Transition appear show={!!productId} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-3xl bg-white dark:bg-[#1C1C1E] p-6 shadow-2xl transition-all border border-gray-100 dark:border-[#2C2C2E]">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                    Product Pricing History
                  </Dialog.Title>
                  <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Loading Records...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Price Change Audit */}
                    <section>
                      <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        Price Change Audit (Selling/Cost)
                      </h4>
                      <div className="space-y-3">
                        {data?.priceLogs.length === 0 ? (
                           <div className="p-4 border border-dashed border-gray-200 dark:border-[#3A3A3C] rounded-2xl text-center text-xs text-gray-500 dark:text-gray-400 italic">
                                No price changes recorded yet.
                           </div>
                        ) : (
                          data?.priceLogs.map((log: any) => (
                            <div key={log.id} className="p-4 bg-gray-50 dark:bg-[#252528] rounded-2xl border border-gray-100 dark:border-[#3A3A3C] shadow-sm flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="text-[10px] space-y-0.5">
                                            <p className="font-bold text-gray-500 dark:text-gray-400 uppercase">Cost</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(log.old_cost)} → {formatCurrency(log.new_cost)}</p>
                                        </div>
                                        <div className="w-px h-6 bg-gray-200 dark:bg-[#3A3A3C]" />
                                        <div className="text-[10px] space-y-0.5">
                                            <p className="font-bold text-gray-500 dark:text-gray-400 uppercase">Selling</p>
                                            <p className="text-sm font-black text-blue-600 dark:text-blue-500">{formatCurrency(log.old_selling)} → {formatCurrency(log.new_selling)}</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">By {log.users?.full_name || 'Admin'}</p>
                                </div>
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{format(new Date(log.created_at), "MMM d, yyyy HH:mm")}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    {/* Restock History */}
                    <section>
                       <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <PackagePlus className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
                        Acquisition History (Restocking)
                      </h4>
                      <div className="space-y-2 border-l-2 border-gray-100 dark:border-[#3A3A3C] ml-2 pl-6 relative">
                        {data?.restockLogs.length === 0 ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400 italic">No restock entries found for this product.</div>
                        ) : (
                          data?.restockLogs.map((log: any) => (
                            <div key={log.id} className="relative pb-6 last:pb-0">
                                <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-[#3A3A3C] border-2 border-white dark:border-[#1C1C1E]" />
                                <div className="flex justify-between items-start">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-black text-gray-900 dark:text-white">+{log.quantity_added} Units Added</p>
                                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500">Unit Cost: {formatCurrency(log.unit_cost)}</p>
                                        {log.note && <p className="text-[10px] italic text-gray-500 dark:text-gray-400 mt-1">"{log.note}"</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{format(new Date(log.created_at), "MMM d, yyyy")}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium lowercase">Recorded by {log.users?.full_name || 'Admin'}</p>
                                    </div>
                                </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    {/* Adjustment History */}
                    <section>
                       <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Scale className="w-3 h-3 text-indigo-600 dark:text-indigo-500" />
                        Inventory Corrections (Audit)
                      </h4>
                      <div className="space-y-3">
                        {data?.adjustmentLogs.length === 0 ? (
                            <div className="p-4 border border-dashed border-gray-200 dark:border-[#3A3A3C] rounded-2xl text-center text-xs text-gray-500 dark:text-gray-400 italic">
                                No corrections or spoilage recorded.
                            </div>
                        ) : (
                          data?.adjustmentLogs.map((log: any) => (
                            <div key={log.id} className="p-4 bg-gray-50 dark:bg-[#252528] rounded-2xl border border-gray-100 dark:border-[#3A3A3C] shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${
                                        Number(log.quantity_change) < 0 ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                    }`}>
                                        {log.reason} ({Number(log.quantity_change) > 0 ? '+' : ''}{log.quantity_change})
                                    </span>
                                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{format(new Date(log.created_at), "MMM d, yyyy")}</p>
                                </div>
                                {log.note && <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">"{log.note}"</p>}
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Recorded by {log.users?.full_name || 'Admin'}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
