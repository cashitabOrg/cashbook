"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { addProduct, editProduct } from "@/app/actions/products";
import { toast } from "sonner";
import { Package, X } from "lucide-react";

type ProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  product?: {
    id: string;
    name: string;
    unit: string;
    min_quantity: number;
    cost_price?: number;
    selling_price?: number;
  } | null;
};

export default function ProductModal({
  isOpen,
  onClose,
  storeSlug,
  product,
}: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!product;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    if (isEditing && product) {
      formData.append("id", product.id);
      const res = await editProduct(storeSlug, formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Product updated");
        onClose();
      }
    } else {
      const res = await addProduct(storeSlug, formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Product created");
        onClose();
      }
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
                    <Package className="w-5 h-5 text-blue-600" />
                    {isEditing ? "Edit Product" : "New Product"}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1" disabled={loading}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      defaultValue={product?.name || ""}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-slate-900"
                      placeholder="e.g., Frozen Chicken Wings"
                    />
                  </div>
                  <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-slate-700">
                      Unit of Measurement
                    </label>
                    <input
                      type="text"
                      name="unit"
                      id="unit"
                      required
                      defaultValue={product?.unit || ""}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-slate-900"
                      placeholder="e.g., kg, pack, carton"
                    />
                  </div>
                  <div>
                    <label htmlFor="minQuantity" className="block text-sm font-medium text-slate-700">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      name="minQuantity"
                      id="minQuantity"
                      required
                      min="0"
                      step="0.01"
                      defaultValue={product?.min_quantity || 0}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-slate-900 no-spinner"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="costPrice" className="block text-sm font-medium text-slate-700">
                        Unit Cost (₦)
                      </label>
                      <input
                        type="number"
                        name="costPrice"
                        id="costPrice"
                        required
                        min="0"
                        step="0.01"
                        defaultValue={product?.cost_price || 0}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-slate-900 no-spinner"
                        placeholder="Cost"
                      />
                    </div>
                    <div>
                      <label htmlFor="sellingPrice" className="block text-sm font-medium text-slate-700">
                        Unit Selling (₦)
                      </label>
                      <input
                        type="number"
                        name="sellingPrice"
                        id="sellingPrice"
                        required
                        min="0"
                        step="0.01"
                        defaultValue={product?.selling_price || 0}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-slate-900 no-spinner"
                        placeholder="Selling"
                      />
                    </div>
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
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Product"}
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
