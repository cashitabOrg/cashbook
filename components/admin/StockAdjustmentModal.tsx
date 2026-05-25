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
  const [adjustmentMode, setAdjustmentMode] = useState<"minus" | "plus" | "set">("minus");
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedReason, setSelectedReason] = useState(REASONS[0].id);

  const currentQty = Number(product?.quantity || 0);
  const val = Number(inputValue || 0);
  
  // Calculate the actual change that will be sent to the database
  let calculatedChange = 0;
  if (adjustmentMode === "set") {
    calculatedChange = val - currentQty;
  } else if (adjustmentMode === "minus") {
    calculatedChange = -Math.abs(val);
  } else {
    calculatedChange = Math.abs(val);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product || val === 0 || (adjustmentMode === "set" && val === currentQty)) {
       if (val === 0) toast.error("Please enter a valid quantity");
       return;
    }
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const finalFormData = new FormData();
    finalFormData.append("product_id", product.id);
    finalFormData.append("quantityChange", calculatedChange.toString());
    finalFormData.append("reason", selectedReason);
    
    // Automatically generate an audit note if it's an override
    let finalNote = (formData.get("note") as string).trim();
    if (adjustmentMode === "set") {
      const auditNote = `[Fridge Audit] Override from ${currentQty.toFixed(2)} to ${val.toFixed(2)}`;
      finalNote = finalNote ? `${finalNote} (${auditNote})` : auditNote;
    }
    finalFormData.append("note", finalNote);
    
    const res = await adjustStock(storeSlug, finalFormData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Inventory synchronized for ${product.name}`);
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-[#1C1C1E] p-6 shadow-2xl transition-all border border-gray-100 dark:border-[#2C2C2E]">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-600" />
                    Correct Stock Level
                  </Dialog.Title>
                  <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-gray-50 dark:bg-[#252528] border border-gray-100 dark:border-[#3A3A3C] rounded-2xl flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Product</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{product.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Current Stock</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{currentQty.toFixed(2)} <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{product.unit}</span></p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Adjustment Mode Toggle - 3 Options */}
                  <div className="flex p-1 bg-gray-100 dark:bg-[#252528] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAdjustmentMode("minus")}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        adjustmentMode === "minus" ? "bg-white dark:bg-[#3A3A3C] text-red-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-bold"
                      }`}
                    >
                      Subtract (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentMode("plus")}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        adjustmentMode === "plus" ? "bg-white dark:bg-[#3A3A3C] text-emerald-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-bold"
                      }`}
                    >
                      Add (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentMode("set")}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        adjustmentMode === "set" ? "bg-white dark:bg-[#3A3A3C] text-indigo-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-bold"
                      }`}
                    >
                      Set (Fridge)
                    </button>
                  </div>

                  {/* Dynamic Input */}
                  <div className="relative">
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                      {adjustmentMode === "set" ? "Exact Count found in Fridge" : "Adjustment Quantity"} ({product.unit})
                    </label>
                    <div className="relative group">
                      <input
                        type="number"
                        name="quantity"
                        required
                        min="0"
                        step="0.01"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={`w-full bg-gray-50 dark:bg-[#252528] border-2 rounded-2xl px-4 py-4 text-bases font-black text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 pr-16 ${
                          adjustmentMode === "minus" ? "focus:border-red-500 focus:bg-red-50/10 border-gray-100 dark:border-[#3A3A3C]" : 
                          adjustmentMode === "plus" ? "focus:border-emerald-500 focus:bg-emerald-50/10 border-gray-100 dark:border-[#3A3A3C]" :
                          "focus:border-indigo-500 focus:bg-indigo-50/10 border-gray-100 dark:border-[#3A3A3C]"
                        }`}
                        placeholder={adjustmentMode === "set" ? "0.00" : "5.00"}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase">
                        {product.unit}
                      </div>
                    </div>

                    {/* Real-time Math Preview - Very important for confidence */}
                    {val > 0 && (
                      <p className={`mt-2 ml-1 text-[10px] font-bold ${
                        calculatedChange >= 0 ? "text-emerald-600" : "text-red-600"
                      } animate-in fade-in slide-in-from-left-1 duration-300`}>
                        {adjustmentMode === "set" ? (
                          <>Result: Stock will {calculatedChange >= 0 ? "increase" : "decrease"} by {Math.abs(calculatedChange).toFixed(2)} units.</>
                        ) : (
                          <>Current {currentQty.toFixed(2)} → New { (currentQty + calculatedChange).toFixed(2) } {product.unit}</>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Reason Selection */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
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
                                ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10" 
                                : "border-gray-100 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#252528] hover:border-gray-200 dark:hover:border-[#4A4A4C]"
                             }`}
                           >
                             <div className={`${reason.color} p-1.5 bg-white dark:bg-[#1C1C1E] rounded-lg shadow-sm`}>{reason.icon}</div>
                             <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{reason.label}</span>
                           </button>
                       ))}
                    </div>
                  </div>

                  {/* Optional Note */}
                  <div>
                    <textarea
                      name="note"
                      rows={2}
                      className="w-full bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#3A3A3C] rounded-2xl px-4 py-3 text-[11px] font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#1C1C1E] outline-none transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="Add an optional audit note explaining this adjustment..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-[#3A3A3C] rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || (adjustmentMode === "set" && Number(inputValue) === currentQty)}
                      className={`flex-1 px-4 py-4 text-[10px] font-black text-white uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                        calculatedChange < 0 ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
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
