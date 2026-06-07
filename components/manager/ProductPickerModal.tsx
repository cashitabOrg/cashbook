"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Package, AlertTriangle, Layers } from "lucide-react";
import { LocalProduct } from "@/lib/db";

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: LocalProduct) => void;
  products: LocalProduct[];
  allowOutOfStock?: boolean;
}

export default function ProductPickerModal({
  isOpen,
  onClose,
  onSelect,
  products,
  allowOutOfStock = false,
}: ProductPickerModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Filter and A-Z sort
  const filteredProducts = useMemo(() => {
    const search = query.toLowerCase().trim();
    return products
      .filter((p) => p.name.toLowerCase().includes(search))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-[#1C1C1E] p-0 text-left align-middle shadow-2xl transition-all border border-slate-100 dark:border-[#2C2C2E] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50 dark:bg-[#252528]/50 dark:bg-[#252528]/50 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-base font-black text-slate-900 dark:text-white">
                        Select Product
                      </Dialog.Title>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">{products.length} Items</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-1.5 hover:bg-white dark:bg-[#1C1C1E] hover:shadow-md rounded-lg transition-all text-slate-400 dark:text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Search Area */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2C2C2E] sticky top-0 bg-white dark:bg-[#1C1C1E] z-10 shrink-0">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:text-blue-400 transition-colors" />
                    <input
                      ref={inputRef}
                      type="text"
                      className="w-full bg-white dark:bg-[#1C1C1E] border-2 border-slate-300 rounded-xl pl-11 pr-4 py-3 text-sm font-black placeholder:text-slate-500 dark:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-black shadow-sm"
                      placeholder="Type to search product..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Product List */}
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-white dark:bg-[#1C1C1E]">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm font-bold text-slate-400 dark:text-gray-500 italic">No products found</p>
                      <button onClick={() => setQuery("")} className="mt-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase hover:underline">Clear Search</button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredProducts.map((p) => {
                        const isStockLow = p.quantity < p.min_quantity;
                        const isOutOfStock = p.quantity <= 0;

                        return (
                          <button
                            key={p.id}
                            onClick={() => onSelect(p)}
                            disabled={isOutOfStock && !allowOutOfStock}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                              isOutOfStock && !allowOutOfStock
                                ? "opacity-40 cursor-not-allowed bg-slate-50 dark:bg-[#252528]"
                                : "hover:bg-blue-50 dark:hover:bg-blue-500/20/50 hover:pl-4 border border-transparent hover:border-blue-100"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2 rounded-lg shrink-0 ${isStockLow ? "bg-red-50 dark:bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-[#2C2C2E] text-slate-400 dark:text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:hover:text-blue-400"}`}>
                                {isOutOfStock ? <AlertTriangle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                              </div>
                              <div className="truncate">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-700 transition-colors truncate">
                                  {p.name}
                                </h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">{p.unit}</p>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-4">
                              <span className={`text-sm font-mono font-bold ${isStockLow ? "text-rose-600" : "text-slate-600 dark:text-gray-300"}`}>
                                {p.quantity.toFixed(2)}
                              </span>
                              <div className="flex justify-end mt-0.5">
                                 {isOutOfStock ? (
                                   <span className={`text-[8px] font-black uppercase px-1 rounded ${allowOutOfStock ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" : "text-rose-600 bg-rose-50"}`}>
                                     {allowOutOfStock ? "Will be Refunded" : "Out of Stock"}
                                   </span>
                                 ) : isStockLow ? (
                                   <span className="text-[8px] font-black text-rose-600 uppercase bg-rose-50 px-1 rounded animate-pulse">Low Stock</span>
                                 ) : (
                                   <span className="text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase">Available</span>
                                 )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
