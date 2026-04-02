"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
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
  } | null;
};

export default function AddStockModal({
  isOpen,
  onClose,
  storeSlug,
  product,
}: AddStockModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("product_id", product.id);
    
    const res = await addStock(storeSlug, formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Successfully added stock to ${product.name}`);
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
                  <p className="text-xs text-slate-500 mt-1">Current Quantity: {product.quantity} {product.unit}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="quantityAdded" className="block text-sm font-medium text-slate-700">
                      Quantity to Add ({product.unit})
                    </label>
                    <input
                      type="number"
                      name="quantityAdded"
                      id="quantityAdded"
                      required
                      min="0.1"
                      step="0.1"
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 border text-slate-900"
                      placeholder="e.g., 50"
                    />
                  </div>
                  
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
