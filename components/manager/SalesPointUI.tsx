"use client";

import { useState, useEffect } from "react";
import { useSalesSession, SaleRow } from "@/hooks/useSalesSession";
import { Plus, X, Search, WifiOff, CheckCircle2, ShoppingBag, Pencil, ShoppingCart, Trash2, RefreshCw } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalProduct } from "@/lib/db";
import { useRealtimeStock } from "@/hooks/useRealtimeStock";
import EditSaleModal from "../admin/EditSaleModal";
import ProductPickerModal from "./ProductPickerModal";

export default function SalesPointUI({
  storeSlug,
  storeId,
  managerId,
  initialProducts,
}: {
  storeSlug: string;
  storeId: string;
  managerId: string;
  initialProducts: any[];
}) {
  // 1. Listen to realtime changes from Supabase (mutates Dexie)
  useRealtimeStock(storeId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  // 2. Hydrate Dexie cache initially if online
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      db.products.bulkPut(
        initialProducts.map(p => ({
          id: p.id,
          store_id: p.store_id || storeId,
          name: p.name,
          unit: p.unit,
          quantity: p.quantity,
          min_quantity: p.min_quantity || 0,
          cost_price: Number(p.cost_price || 0),
          selling_price: Number(p.selling_price || 0),
          last_synced: Date.now()
        }))
      ).catch(err => console.error("Initial product hydration failed:", err));
    }
  }, [initialProducts, storeId]);

  // 3. Reactively read products from Dexie and sort A-Z
  const liveProducts = useLiveQuery(
    () => db.products.where('store_id').equals(storeId).toArray(),
    [storeId]
  );

  const rawProducts = liveProducts || initialProducts || [];
  const products = [...rawProducts].sort((a, b) => a.name.localeCompare(b.name));

  // 4. Listen to offline queue count for sync feedback
  const pendingSyncCount = useLiveQuery(
    () => db.offlineQueue.count(),
    []
  ) ?? 0;

  const {
    isOnline,
    sessionId,
    isStarting,
    isEnding,
    isStale,
    rows,
    totalRevenue,
    totalItems,
    startSession,
    addEmptyRow,
    updateRow,
    commitRow,
    removeRow,
    uncommitRow,
    endSession,
    refreshSession
  } = useSalesSession(storeSlug, storeId, managerId);

  const handleOpenPicker = (rowId: string) => {
    setActiveRowId(rowId);
    setPickerOpen(true);
  };

  const handleSelectProduct = (product: LocalProduct) => {
    if (activeRowId) {
      updateRow(activeRowId, "productId", product.id);
      updateRow(activeRowId, "productName", product.name);
    }
    setPickerOpen(false);
    setActiveRowId(null);
  };

  // A simple product search capability within the dropdown could be built natively 
  // with a datalist or custom combobox. For simplicity we use a select, but real 
  // world would use headlessui combobox.
  
  if (!sessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
        <div className="bg-blue-50 p-6 rounded-full mb-6">
          <ShoppingBag className="w-16 h-16 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Ready for Sales</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Start a new session to begin recording sales, applying prices, and automatically updating stock in real-time.
        </p>
        <button
          onClick={startSession}
          disabled={isStarting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isStarting ? "Initializing..." : "Start Sales Session"}
        </button>
        
        {!isOnline && (
          <div className="mt-8 flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            Offline Mode — Changes will sync on reconnect
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-slate-50/50 w-full max-w-7xl mx-auto lg:px-8 lg:py-6 lg:h-auto">
      {/* Top Banner */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 text-amber-700 bg-amber-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter shadow-sm shrink-0 lg:rounded-b-xl lg:-mt-6 lg:mb-4">
          <WifiOff className="w-3.5 h-3.5" />
          Offline Mode — changes will sync automatically on reconnect
        </div>
      )}

      {isStale && (
        <div className="flex items-center justify-center gap-2 text-rose-700 bg-rose-50 border-b border-rose-100 px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-widest shadow-sm shrink-0 lg:rounded-b-xl lg:-mt-6 lg:mb-4">
          <div className="animate-pulse bg-rose-500 w-2 h-2 rounded-full" />
          This session was started on a previous day. We recommend ending it and starting a new one for accurate reporting.
        </div>
      )}

      {/* Summary Bar */}
      <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 p-4 lg:p-6 mb-2 lg:mb-6 flex flex-wrap gap-4 justify-between items-center isolate relative overflow-hidden shrink-0 border-b border-slate-100">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex gap-4 lg:gap-8 items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Items</p>
            <p className="text-xl lg:text-2xl font-black text-slate-900 leading-none">{totalItems.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Session Revenue</p>
            <p className="text-xl lg:text-2xl font-black text-emerald-600 leading-none">₦{totalRevenue.toFixed(2)}</p>
          </div>
          
          {/* SYNC STATUS BADGE */}
          <div className="h-10 w-px bg-slate-100 mx-2 hidden sm:block" />
          
          <div className="flex flex-col">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Sync Status</p>
            {pendingSyncCount > 0 ? (
              <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 animate-pulse transition-all">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-tight">{pendingSyncCount} Items Syncing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 transition-all">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-tight">Cloud Synced</span>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={endSession}
          disabled={isEnding || rows.some(r => !r.synced)}
          className="relative z-10 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 sm:px-6 sm:py-3 text-[10px] sm:text-xs font-black text-white shadow-lg hover:bg-slate-800 transition-all active:scale-95 gap-2 uppercase tracking-widest disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          End Session
        </button>
      </div>

      <div className="flex-1 overflow-visible flex flex-col mb-24 lg:mb-0 px-2 lg:px-0">

      {/* Sale Entry Table Container */}
      <div className="bg-white lg:rounded-2xl lg:shadow-xl lg:shadow-slate-200/40 lg:border border-slate-200 flex-1 flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1 lg:rounded-2xl">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6 w-12 text-center">#</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 w-1/3">Product</th>
                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">Qty Sold</th>
                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 w-32">Total Price</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 w-32">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, index) => {
                const selectedProduct = products.find(p => p.id === row.productId);
                
                return (
                  <tr key={row.localId} className={row.synced ? "bg-slate-50/50" : ""}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-500 sm:pl-6 text-center">
                      {index + 1}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900">
                      {row.synced ? (
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-slate-900">{row.productName}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenPicker(row.localId)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg border-2 transition-all flex items-center justify-between group ${
                            row.productId ? "bg-white border-blue-100 text-slate-900 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300"
                          }`}
                        >
                          <span className={`${row.productId ? "font-bold" : "font-medium"}`}>
                            {row.productName || "Choose product..."}
                          </span>
                          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                        </button>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          disabled={row.synced || !row.productId}
                          min="0.01"
                          max={selectedProduct ? selectedProduct.quantity : undefined}
                          step="0.01"
                          value={row.quantitySold}
                          onChange={(e) => updateRow(row.localId, "quantitySold", parseFloat(e.target.value) || '')}
                          onBlur={() => { if (!row.synced && row.productId && row.subtotal && row.quantitySold) commitRow(row) }}
                          className="block w-24 rounded-md border-0 py-1.5 text-right text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:bg-slate-50"
                          placeholder="Qty"
                        />
                        <span className="text-slate-400 text-xs w-6 text-left">{selectedProduct?.unit || ''}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 text-right w-32">
                      <div className="relative rounded-md shadow-sm flex items-center justify-end">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-slate-500 sm:text-sm">₦</span>
                        </div>
                        <input
                          type="number"
                          disabled={row.synced || !row.productId}
                          min="0"
                          step="0.01"
                          value={row.subtotal}
                          onChange={(e) => updateRow(row.localId, "subtotal", parseFloat(e.target.value) || '')}
                          onBlur={() => { if (!row.synced && row.productId && row.subtotal && row.quantitySold) commitRow(row) }}
                          className="block w-full rounded-md border-0 py-1.5 pl-7 pr-3 text-right font-semibold text-emerald-700 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:bg-slate-50"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      {row.synced ? (
                        <div className="flex items-center justify-end gap-2 pr-2">
                           {row.dbId ? (
                             <EditSaleModal 
                                itemId={row.dbId} 
                                initialQty={Number(row.quantitySold)} 
                                initialRevenue={Number(row.subtotal)} 
                                productName={selectedProduct?.name || "Product"} 
                                onSuccess={refreshSession}
                             />
                           ) : (
                             <div className="flex items-center gap-1">
                               <button
                                 onClick={() => uncommitRow(row.localId)}
                                 className="text-amber-500 hover:text-amber-700 bg-amber-50 p-1.5 rounded transition-colors"
                                 title="Edit recent sale"
                               >
                                 <Pencil className="w-5 h-5" />
                               </button>
                               <button
                                 onClick={() => removeRow(row.localId)}
                                 className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded transition-colors"
                                 title="Delete recent sale"
                               >
                                 <Trash2 className="w-5 h-5" />
                               </button>
                             </div>
                           )}
                           <span className="sr-only">Saved</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => removeRow(row.localId)}
                          className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded disabled:opacity-50"
                          title="Remove row"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {/* Add Row Button Area */}
              <tr>
                <td colSpan={6} className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                  <button
                    onClick={addEmptyRow}
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ProductPickerModal 
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectProduct}
        products={products}
      />
      </div>
    </div>
  );
}
