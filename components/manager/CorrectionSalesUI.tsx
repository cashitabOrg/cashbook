"use client";

import { useState } from "react";
import { useCorrectionSession } from "@/hooks/useCorrectionSession";
import { Plus, X, Search, CheckCircle2, ShoppingBag, Pencil, ShoppingCart, Trash2 } from "lucide-react";
import ProductPickerModal from "./ProductPickerModal";
import EditSaleModal from "../admin/EditSaleModal";

export default function CorrectionSalesUI({
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const products = [...initialProducts].sort((a, b) => a.name.localeCompare(b.name));

  const {
    sessionId,
    isStarting,
    isEnding,
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
  } = useCorrectionSession(storeSlug, storeId, managerId);

  const handleOpenPicker = (rowId: string) => {
    setActiveRowId(rowId);
    setPickerOpen(true);
  };

  const handleSelectProduct = (product: any) => {
    if (activeRowId) {
      updateRow(activeRowId, "productId", product.id);
      updateRow(activeRowId, "productName", product.name);
    }
    setPickerOpen(false);
    setActiveRowId(null);
  };
  
  if (!sessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
        <div className="bg-purple-50 p-6 rounded-full mb-6 border-4 border-purple-100">
          <ShoppingBag className="w-16 h-16 text-purple-600" />
        </div>
        <h2 className="text-3xl font-black text-purple-900 mb-2">Retroactive Correction Portal</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Start a new session to record sales for Sunday, April 5th. All items entered here will be forcefully backdated in the database.
        </p>
        <button
          onClick={startSession}
          disabled={isStarting}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg font-bold shadow-md transition-colors disabled:opacity-50"
        >
          {isStarting ? "Initializing..." : "Start Backdated Session"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-purple-50/30 w-full max-w-7xl mx-auto lg:px-8 lg:py-6 lg:h-auto border-x-4 border-purple-500">
      <div className="bg-purple-700 text-white text-center py-2 font-black tracking-widest text-sm uppercase rounded-b-xl -mt-6 mb-4 shadow-md">
        Developer Mode: Retroactive Entry active (Sunday, April 5th)
      </div>

      {/* Summary Bar */}
      <div className="bg-white lg:rounded-xl shadow-sm border-2 border-purple-200 p-4 lg:p-6 mb-2 lg:mb-6 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-4 lg:gap-8 items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Items</p>
            <p className="text-xl lg:text-2xl font-black text-slate-900">{totalItems.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Revenue</p>
            <p className="text-xl lg:text-2xl font-black text-purple-600">₦{totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        <button
          onClick={endSession}
          disabled={isEnding || rows.some(r => !r.synced)}
          className="inline-flex items-center rounded-xl bg-purple-900 px-4 py-2 sm:px-6 sm:py-3 text-[10px] sm:text-xs font-black text-white shadow-lg hover:bg-purple-800 disabled:opacity-50 gap-2 uppercase tracking-widest"
        >
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          Close Backdated Session
        </button>
      </div>

      <div className="flex-1 overflow-visible flex flex-col mb-24 lg:mb-0">
      <div className="bg-white lg:rounded-2xl lg:shadow-xl lg:border border-purple-100 flex-1 flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1 lg:rounded-2xl">
          <table className="min-w-full divide-y divide-purple-100">
            <thead className="bg-purple-50 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-purple-900 w-12 text-center">#</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-purple-900 w-1/3">Product</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-purple-900">Qty</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-purple-900 w-32">Total</th>
                <th className="py-3.5 pl-3 pr-4 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50 bg-white">
              {rows.map((row, index) => {
                const selectedProduct = products.find(p => p.id === row.productId);
                
                return (
                  <tr key={row.localId} className={row.synced ? "bg-purple-50/50" : ""}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-center">{index + 1}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      {row.synced ? (
                        <span className="font-bold text-slate-900">{row.productName}</span>
                      ) : (
                        <button
                          onClick={() => handleOpenPicker(row.localId)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg border-2 flex items-center justify-between ${
                            row.productId ? "bg-white border-purple-200 shadow-sm" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <span className={row.productId ? "font-bold" : "font-medium"}>
                            {row.productName || "Choose product..."}
                          </span>
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          disabled={row.synced || !row.productId}
                          min="0.01"
                          value={row.quantitySold}
                          onChange={(e) => updateRow(row.localId, "quantitySold", parseFloat(e.target.value) || '')}
                          onBlur={() => { if (!row.synced && row.productId && row.subtotal && row.quantitySold) commitRow(row) }}
                          className="block w-24 border border-slate-300 rounded px-2 py-1 text-right disabled:opacity-50"
                        />
                        <span className="text-xs text-slate-400">{selectedProduct?.unit || ''}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right">
                      <input
                        type="number"
                        disabled={row.synced || !row.productId}
                        value={row.subtotal}
                        onChange={(e) => updateRow(row.localId, "subtotal", parseFloat(e.target.value) || '')}
                        onBlur={() => { if (!row.synced && row.productId && row.subtotal && row.quantitySold) commitRow(row) }}
                        className="block w-full border border-slate-300 rounded px-2 py-1 text-right text-purple-700 font-bold disabled:opacity-50"
                      />
                    </td>
                    <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right">
                      {row.synced ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => uncommitRow(row.localId)} className="text-amber-500 bg-amber-50 p-1.5 rounded">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeRow(row.localId)} className="text-rose-500 bg-rose-50 p-1.5 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => removeRow(row.localId)} className="text-red-500 bg-red-50 p-1.5 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={5} className="px-6 py-4 bg-purple-50/30 border-t border-purple-100">
                  <button onClick={addEmptyRow} className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800 bg-purple-100 px-3 py-1.5 rounded">
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
