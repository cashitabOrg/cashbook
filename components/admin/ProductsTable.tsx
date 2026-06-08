"use client";

import { useState } from "react";
import ProductDetailsDrawer from "./ProductDetailsDrawer";
import { AlertTriangle, Archive, Sliders } from "lucide-react";

type Product = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  selling_price: number;
  created_at: string;
};

export default function ProductsTable({
  storeSlug,
  products,
  isLimitReached = false,
}: {
  storeSlug: string;
  products: Product[];
  isLimitReached?: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const handleManageProduct = (product: Product) => {
    setActiveProduct(product);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="bg-white dark:bg-[#1C1C1E] lg:rounded-2xl lg:shadow-sm lg:border border-gray-200 dark:border-[#2C2C2E] p-4 lg:p-6 transition-colors">
        <div className="hidden md:block mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow-sm dark:shadow-2xl ring-1 ring-gray-200 dark:ring-[#2C2C2E] sm:rounded-lg transition-colors">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2C2C2E]">
                  <thead className="bg-gray-50 dark:bg-[#252528]">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Stock Level
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Unit
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#2C2C2E] bg-white dark:bg-[#1C1C1E]">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                        <Archive className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">No products</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first product.</p>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const isLowStock = product.quantity < product.min_quantity;
                      
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-[#2C2C2E]/50 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900 dark:text-gray-200 sm:pl-6">
                            {product.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                            {Number(product.quantity || 0).toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {product.unit}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {isLowStock ? (
                              <span className="inline-flex items-center rounded-md bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/30">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                                Healthy
                              </span>
                            )}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end items-center">
                              <button
                                onClick={() => handleManageProduct(product)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-all active:scale-95 border border-blue-500/20"
                              >
                                Manage Stock
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden flex flex-col gap-3 mt-1">
        {products.length === 0 ? (
          <div className="py-12 text-center border rounded-lg border-gray-200 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E]">
            <Archive className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">No products</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Get started by adding your first product.</p>
          </div>
        ) : (
          <>
            {/* Mobile Column Headers */}
            <div className="grid grid-cols-12 items-center bg-transparent border border-transparent p-3 gap-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <div className="col-span-7 pl-3.5 text-left">Product</div>
              <div className="col-span-3 text-center">Stock Level</div>
              <div className="col-span-2 text-right">Manage</div>
            </div>

            {products.map((product) => {
              const isLowStock = product.quantity < product.min_quantity;

              return (
                <div key={product.id} className="grid grid-cols-12 items-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-xl shadow-sm p-3 gap-2 transition-colors">
                  {/* Name & Status */}
                  <div className="col-span-7 flex flex-col min-w-0 justify-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span 
                        className={`w-2 h-2 rounded-full shrink-0 ${isLowStock ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} 
                        title={isLowStock ? 'Low Stock' : 'Healthy'}
                      />
                      <span className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">{product.name}</span>
                    </div>
                    <span className={`text-[9px] pl-3.5 leading-none mt-1 font-bold ${isLowStock ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isLowStock ? 'Low Stock' : 'Healthy'}
                    </span>
                  </div>

                  {/* Stock Level */}
                  <div className="col-span-3 flex items-center justify-center text-center">
                    <span className="text-xs font-mono font-bold text-gray-900 dark:text-gray-200">
                      {Number(product.quantity || 0).toFixed(2)}
                      <span className="text-[8px] text-gray-400 uppercase font-medium ml-0.5">{product.unit}</span>
                    </span>
                  </div>

                  {/* Manage Action */}
                  <div className="col-span-2 flex items-center justify-end">
                    <button
                      onClick={() => handleManageProduct(product)}
                      className="p-1.5 text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-all active:scale-95 border border-blue-500/20 shrink-0"
                      title="Manage Stock"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>

      <ProductDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setActiveProduct(null);
        }}
        storeSlug={storeSlug}
        product={activeProduct}
      />
    </>
  );
}
