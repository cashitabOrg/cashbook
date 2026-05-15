"use client";

import { useState } from "react";
import { useCorrectionSession } from "@/hooks/useCorrectionSession";
import { Plus } from "lucide-react";
import ProductPickerModal from "./ProductPickerModal";
import CorrectionStartView from "./correction/CorrectionStartView";
import CorrectionHeader from "./correction/CorrectionHeader";
import CorrectionTableRow from "./correction/CorrectionTableRow";
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
    return <CorrectionStartView startSession={startSession} isStarting={isStarting} />;
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-purple-50/30 w-full max-w-7xl mx-auto lg:px-8 lg:py-6 lg:h-auto border-x-4 border-purple-500">
      <CorrectionHeader 
        targetDate={targetDate}
        setTargetDate={setTargetDate}
        availableDates={availableDates}
        totalItems={totalItems}
        totalRevenue={totalRevenue}
        handleAtomicSubmit={handleAtomicSubmit}
        isSubmitting={isSubmitting}
        rowCount={rows.length}
      />

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
                {rows.map((row, index) => (
                  <CorrectionTableRow 
                    key={row.localId}
                    row={row}
                    index={index}
                    products={products}
                    handleOpenPicker={handleOpenPicker}
                    updateRow={updateRow}
                    removeRow={removeRow}
                  />
                ))}
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
          allowOutOfStock={true}
        />
      </div>
    </div>
  );
}
