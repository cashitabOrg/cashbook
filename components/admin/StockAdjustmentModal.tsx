"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { adjustStock } from "@/app/actions/products";
import { toast } from "sonner";
import { Scale, X, AlertTriangle, CheckCircle2 } from "lucide-react";

type StockAdjustmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  product: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
  } | null;
};

const REASONS = [
  { id: "Spoiled", label: "Spoiled / Expired", color: "text-red-600", icon: <X className="w-3.5 h-3.5" /> },
  { id: "Damaged", label: "Damaged Stock", color: "text-orange-600", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { id: "Correction", label: "Inventory Correction (Error)", color: "text-blue-600", icon: <Scale className="w-3.5 h-3.5" /> },
  { id: "Other", label: "Other Loss / Gain", color: "text-slate-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
];

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  storeSlug,
  product,
}: StockAdjustmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"reduction" | "addition">("reduction");
  const [selectedReason, setSelectedReason] = useState(REASONS[0].id);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const qtyInput = Number(formData.get("quantity"));
    
    // Ensure negative if reduction
    const quantityChange = adjustmentType === "reduction" ? -Math.abs(qtyInput) : Math.abs(qtyInput);
    
    const finalFormData = new FormData();
    finalFormData.append("product_id", product.id);
    finalFormData.append("quantityChange", quantityChange.toString());
    finalFormData.append("reason", selectedReason);
    finalFormData.append("note", formData.get("note") as string);
    
    const res = await adjustStock(storeSlug, finalFormData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Inventory adjusted for ${product.name}`);
      onClose();
    }
    setLoading(false);
  };

  if (!product) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-600" />
                    Correct Stock Level
                  </Dialog.Title>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</p>
                        <p className="text-sm font-bold text-slate-900">{product.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stock</p>
                        <p className="text-sm font-black text-slate-900">{Number(product.quantity).toFixed(2)} <span className="text-[10px] text-slate-500 uppercase">{product.unit}</span></p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Adjustment Direction Toggle */}
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAdjustmentType("reduction")}
                      className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                        adjustmentType === "reduction" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Reduction (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentType("addition")}
                      className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                        adjustmentType === "addition" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Addition (+)
                    </button>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Adjustment Quantity ({product.unit})
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                      placeholder="e.g., 5.00"
                    />
                  </div>

                  {/* Reason Selection */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      Reason for Correction
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                       {REASONS.map((reason) => (
                           <button
                             key={reason.id}
                             type="button"
                             onClick={() => setSelectedReason(reason.id)}
                             className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left ${
                                selectedReason === reason.id 
                                ? "border-indigo-600 bg-indigo-50/50" 
                                : "border-slate-100 bg-slate-50 hover:border-slate-200"
                             }`}
                           >
                             <div className={`${reason.color} p-1.5 bg-white rounded-lg shadow-sm`}>{reason.icon}</div>
                             <span className="text-[10px] font-bold text-slate-700">{reason.label}</span>
                           </button>
                       ))}
                    </div>
                  </div>

                  {/* Optional Note */}
                  <div>
                    <textarea
                      name="note"
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-300"
                      placeholder="Add an optional audit note explaining this adjustment..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 px-4 py-3 text-[10px] font-black text-white uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                        adjustmentType === "reduction" ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                      }`}
                    >
                      {loading ? "Processing..." : "Submit Correction"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
