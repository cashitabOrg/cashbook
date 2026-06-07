"use client";

import { useState } from "react";
import ProductModal from "./ProductModal";
import ProductDetailsDrawer from "./ProductDetailsDrawer";
import { deleteProduct } from "@/app/actions/products";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle, Archive, ChevronDown, ChevronUp, Search } from "lucide-react";

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
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleManageProduct = (product: Product) => {
    setActiveProduct(product);
    setDrawerOpen(true);
  };

  const handleAddNew = () => {
    setActiveProduct(null);
    setProductModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"? It will be hidden from all active lists but its sales history and audit trail will be fully preserved.`)) {
      return;
    }
    
    setIsDeleting(id);
    const formData = new FormData();
    formData.append("id", id);
    
    const res = await deleteProduct(storeSlug, formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`"${name}" has been archived.`);
    }
    setIsDeleting(null);
  };

  return (
    <>
      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-xl px-4 lg:px-6 py-4 flex flex-row items-center justify-between gap-2 sm:gap-4 mb-4 shadow-sm dark:shadow-2xl transition-colors">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Archive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm sm:text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none">Products</h1>
            <p className="hidden sm:block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Inventory Management</p>
          </div>
        </div>

        {/* Unified Search Box */}
        <div className="relative flex-1 min-w-0 max-w-xs md:max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#2C2C2E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 focus:ring-blue-400 transition-all outline-none font-medium"
          />
        </div>
        
        <button
          type="button"
          onClick={handleAddNew}
          disabled={isLimitReached}
          className={`relative z-10 inline-flex items-center rounded-xl px-4 py-2 text-[10px] font-black shadow-sm transition-all active:scale-95 gap-2 uppercase tracking-widest shrink-0 ${
            isLimitReached 
              ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed grayscale" 
              : "bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          }`}
        >
          {isLimitReached ? <AlertTriangle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span className="hidden sm:inline">{isLimitReached ? "Limit Reached" : "Add Product"}</span>
        </button>
      </div>

      <div className="px-2 lg:px-0">
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="hidden md:block overflow-hidden shadow-sm dark:shadow-2xl ring-1 ring-gray-200 dark:ring-[#2C2C2E] sm:rounded-lg transition-colors">
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
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                        <Archive className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">No products</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first product.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
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
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => handleManageProduct(product)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-all active:scale-95 border border-blue-500/20"
                              >
                                Manage Stock
                              </button>
                              
                              <button
                                onClick={() => handleDelete(product.id, product.name)}
                                disabled={isDeleting === product.id}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
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
              
              {/* Mobile Cards View */}
              <div className="md:hidden flex flex-col gap-3 mt-4">
                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center border rounded-lg border-gray-200 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E]">
                    <Archive className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">No products</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Get started by adding your first product.</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const isLowStock = product.quantity < product.min_quantity;
                    const isExpanded = expandedId === product.id;

                    return (
                      <div key={product.id} className="flex flex-col bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-xl overflow-hidden shadow-sm">
                        <div 
                          onClick={() => setExpandedId(prev => prev === product.id ? null : product.id)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252528]/50 transition-colors"
                        >
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{product.name}</span>
                            {isLowStock ? (
                              <span className="inline-flex items-center w-fit rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 ring-1 ring-inset ring-red-500/20">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center w-fit rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                                Healthy
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 border-t border-gray-100 dark:border-[#2C2C2E] bg-gray-50 dark:bg-[#252528]/30 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Stock Level</span>
                                <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-200">{Number(product.quantity || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Unit</span>
                                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{product.unit}</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-2">
                              <button
                                onClick={() => handleManageProduct(product)}
                                className="w-full flex justify-center items-center gap-2 py-2.5 text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-all active:scale-95 border border-blue-500/20"
                              >
                                Manage Stock
                              </button>
                              
                              <button
                                onClick={() => handleDelete(product.id, product.name)}
                                disabled={isDeleting === product.id}
                                className="w-full flex justify-center items-center gap-2 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 bg-red-500/10 hover:bg-red-500/20 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-all active:scale-95 border border-red-500/20 disabled:opacity-50"
                              >
                                <Archive className="w-4 h-4" />
                                Archive Product
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
        </div>
        </div>
      </div>

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setActiveProduct(null);
        }}
        storeSlug={storeSlug}
        product={activeProduct}
      />

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
