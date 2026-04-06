"use client";

import { useState } from "react";
import { useCorrectionSession } from "@/hooks/useCorrectionSession";
import { Plus, X, Search, ShoppingBag, ShoppingCart } from "lucide-react";
import ProductPickerModal from "./ProductPickerModal";
import { wipeAndOverwriteDay } from "@/app/[storeSlug]/manager/correction/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CorrectionSalesUI({
  storeSlug,
  storeId,
  managerId,
  initialProducts,
  availableDates,
}: {
  storeSlug: string;
  storeId: string;
  managerId: string;
  initialProducts: any[];
  availableDates: string[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetDate, setTargetDate] = useState(availableDates.length > 0 ? availableDates[0] : "2026-04-05");
  const router = useRouter();

  const products = [...initialProducts].sort((a, b) => a.name.localeCompare(b.name));

  const {
    sessionId,
    isStarting,
    rows,
    totalRevenue,
    totalItems,
    startSession,
    addEmptyRow,
    updateRow,
    removeRow,
    clearSessionLocal
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

  const handleAtomicSubmit = async () => {
    // Validate rows
    const validRows = rows.filter(r => r.productId && r.quantitySold && r.subtotal);
    if (validRows.length === 0 && rows.length > 0) {
      toast.error("Please fill out the product details correctly.");
      return;
    }

    const confirmWipe = window.confirm(
      `Are you absolutely sure you want to COMPLETELY WIPE sales on ${targetDate} and REPLACE them with these exact ` + validRows.length + ` entries?`
    );

    if (!confirmWipe) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading(`Wiping corrupted history on ${targetDate} and injecting new corrections...`);

    try {
      const res = await wipeAndOverwriteDay(storeId, managerId, validRows, totalRevenue, targetDate);
      if (res?.success) {
        toast.dismiss(loadingToast);
        toast.success(`Atomic Recovery Successful! ${targetDate} is perfectly restored.`);
        clearSessionLocal();
        router.push(`/${storeSlug}/manager/dashboard`);
      }
    } catch (e: any) {
      toast.dismiss(loadingToast);
      toast.error("CRITICAL FAILURE", { description: e.message || "Something catastrophic occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!sessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
        <div className="bg-purple-50 p-6 rounded-full mb-6 border-4 border-purple-100">
          <ShoppingBag className="w-16 h-16 text-purple-600" />
        </div>
        <h2 className="text-3xl font-black text-purple-900 mb-2">Atomic Correction Portal</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Type missing entries here natively. When you click Submit, the system will instantly wipe the selected date's corrupted records and replace them automatically with yours.
        </p>
        <button
          onClick={startSession}
          disabled={isStarting}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg font-bold shadow-md transition-colors disabled:opacity-50"
        >
          {isStarting ? "Initializing..." : "Start Atomic Session"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-purple-50/30 w-full max-w-7xl mx-auto lg:px-8 lg:py-6 lg:h-auto border-x-4 border-purple-500">
      <div className="bg-purple-700 text-white text-center py-2 font-black tracking-widest text-sm uppercase rounded-b-xl -mt-6 mb-4 shadow-md flex items-center justify-center gap-4">
        <span>Developer Mode: Atomic Retroactive Entry for</span>
        <select 
          value={targetDate} 
          onChange={(e) => setTargetDate(e.target.value)} 
          className="text-slate-900 px-3 py-1 rounded text-xs font-bold w-40 border-2 border-purple-400 focus:outline-none focus:ring focus:ring-purple-200"
        >
          {availableDates.length === 0 ? (
             <option value="2026-04-05">2026-04-05</option>
          ) : (
            availableDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))
          )}
        </select>
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
          onClick={handleAtomicSubmit}
          disabled={isSubmitting || rows.length === 0}
          className="inline-flex items-center rounded-xl bg-purple-900 px-4 py-2 sm:px-6 sm:py-3 text-[10px] sm:text-lg font-black text-white shadow-lg hover:bg-rose-600 transition-colors disabled:opacity-50 gap-2 uppercase tracking-widest animate-pulse"
        >
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          {isSubmitting ? "OVERWRITING DATE..." : "WIPE & INJECT DATA"}
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
                  <tr key={row.localId}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-center">{index + 1}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <button
                          onClick={() => handleOpenPicker(row.localId)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg border-2 flex items-center justify-between group ${
                            row.productId ? "bg-white border-purple-200 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}
                        >
                          <span className={row.productId ? "font-bold" : "font-medium"}>
                            {row.productName || "Choose product..."}
                          </span>
                          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                        </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          disabled={!row.productId}
                          min="0.01"
                          value={row.quantitySold}
                          onChange={(e) => updateRow(row.localId, "quantitySold", parseFloat(e.target.value) || '')}
                          className="block w-24 border border-slate-300 rounded px-2 py-1 text-right disabled:opacity-50"
                        />
                        <span className="text-xs text-slate-400">{selectedProduct?.unit || ''}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right">
                      <input
                        type="number"
                        disabled={!row.productId}
                        value={row.subtotal}
                        onChange={(e) => updateRow(row.localId, "subtotal", parseFloat(e.target.value) || '')}
                        className="block w-full border border-slate-300 rounded px-2 py-1 text-right text-purple-700 font-bold disabled:opacity-50"
                      />
                    </td>
                    <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right">
                        <button onClick={() => removeRow(row.localId)} className="text-red-500 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors">
                          <X className="w-4 h-4" />
                        </button>
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
