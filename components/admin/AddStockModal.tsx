"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { addStock } from "@/app/actions/products";
import { toast } from "sonner";
import { PlusCircle, X } from "lucide-react";

type AddStockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  product: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    cost_price?: number;
    selling_price?: number;
  } | null;
};

export default function AddStockModal({
  isOpen,
  onClose,
  storeSlug,
  product,
}: AddStockModalProps) {
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState<number>(0);
  const [cost, setCost] = useState<number>(product?.cost_price || 0);
  const [selling, setSelling] = useState<number>(product?.selling_price || 0);
  const [syncPrice, setSyncPrice] = useState(true);

  // Reset quantity and update prices when product changes or modal opens
  useEffect(() => {
    if (isOpen && product) {
      setQty(0);
      setCost(product.cost_price || 0);
      setSelling(product.selling_price || 0);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const totalInvestment = Number(qty || 0) * Number(cost || 0);
  const expectedRevenue = Number(qty || 0) * Number(selling || 0);
  const projectedProfit = expectedRevenue - totalInvestment;

  const isPriceChanged = 
    (Number(cost) !== Number(product.cost_price || 0)) || 
    (Number(selling) !== Number(product.selling_price || 0));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const quantity = Number(formData.get("quantityAdded"));
    
    if (quantity <= 0) {
      toast.error("Please enter a valid quantity greater than 0");
      setLoading(false);
      return;
    }

    formData.append("product_id", product.id);
    // Safety Guard: Only send 'true' if price actually changed AND checkbox is checked
    formData.append("syncPrice", (isPriceChanged && syncPrice).toString());
    
    const res = await addStock(storeSlug, formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Successfully added stock to ${product.name}`);
      onClose();
    }
    setLoading(false);
  };

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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-slate-100">
                <div className="flex justify-between items-center mb-5">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-slate-900 flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5 text-emerald-600" />
                    Add Stock to Inventory
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1" disabled={loading}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <p className="text-sm text-slate-500">Product</p>
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Current Quantity: {Number(product.quantity || 0).toFixed(2)} {product.unit}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="quantityAdded" className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                        Qty ({product.unit})
                      </label>
                      <input
                        type="number"
                        name="quantityAdded"
                        id="quantityAdded"
                        required
                        min="0.01"
                        step="0.01"
                        value={qty || ""}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs px-2.5 py-2.5 border text-slate-900 font-bold"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label htmlFor="unitCost" className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                        Cost (₦)
                      </label>
                      <input
                        type="number"
                        name="unitCost"
                        id="unitCost"
                        required
                        min="0"
                        step="0.01"
                        value={cost || ""}
                        onChange={(e) => setCost(Number(e.target.value))}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs px-2.5 py-2.5 border text-slate-900 font-bold"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label htmlFor="unitSelling" className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                        Selling (₦)
                      </label>
                      <input
                        type="number"
                        name="unitSelling"
                        id="unitSelling"
                        required
                        min="0"
                        step="0.01"
                        value={selling || ""}
                        onChange={(e) => setSelling(Number(e.target.value))}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs px-2.5 py-2.5 border text-slate-900 font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Sync Price Toggle - Only show if prices actually changed */}
                  {isPriceChanged && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 animate-in fade-in slide-in-from-top-1 duration-200">
                      <input
                        type="checkbox"
                        id="syncPriceCheckbox"
                        checked={syncPrice}
                        onChange={(e) => setSyncPrice(e.target.checked)}
                        className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <label htmlFor="syncPriceCheckbox" className="text-[9px] font-bold text-amber-700 uppercase tracking-tight leading-tight">
                        Update product default prices to ₦{Number(cost || 0).toLocaleString()} (Cost) & ₦{Number(selling || 0).toLocaleString()} (Selling)
                      </label>
                    </div>
                  )}

                  {/* Compact Financial Summary - 3 Column Grid matches inputs style */}
                  {qty > 0 && (
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 ml-1">Investment</p>
                        <p className="text-xs font-bold text-slate-900 ml-1">₦{totalInvestment.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 ml-1">Exp. Revenue</p>
                        <p className="text-xs font-bold text-slate-900 ml-1">₦{expectedRevenue.toLocaleString()}</p>
                      </div>
                      <div className="text-right pr-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Exp. Profit</p>
                        <p className={`text-xs font-black ${projectedProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          ₦{projectedProfit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-slate-700">
                      Note (Optional)
                    </label>
                    <textarea
                      name="note"
                      id="note"
                      rows={2}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 border resize-none text-slate-900"
                      placeholder="e.g., Restock from Supplier A"
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Adding Stock..." : "Confirm Restock"}
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
