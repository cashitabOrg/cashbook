"use client";

import { useState } from "react";
import ProductModal from "./ProductModal";
import AddStockModal from "./AddStockModal";
import StockAdjustmentModal from "./StockAdjustmentModal";
import { deleteProduct } from "@/app/actions/products";
import { toast } from "sonner";
import { Plus, Edit, Trash2, AlertTriangle, Archive, Scale } from "lucide-react";

type Product = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_price?: number;
  selling_price?: number;
  created_at: string;
};

export default function ProductsTable({
  storeSlug,
  products,
}: {
  storeSlug: string;
  products: Product[];
}) {
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleEdit = (product: Product) => {
    setActiveProduct(product);
    setProductModalOpen(true);
  };

  const handleAddStock = (product: Product) => {
    setActiveProduct(product);
    setStockModalOpen(true);
  };

  const handleAddNew = () => {
    setActiveProduct(null);
    setProductModalOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setActiveProduct(product);
    setAdjustmentModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(id);
    const formData = new FormData();
    formData.append("id", id);
    
    const res = await deleteProduct(storeSlug, formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Product deleted successfully");
    }
    setIsDeleting(null);
  };

  return (
    <>
      <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between mb-6 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Archive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Products</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Inventory Management</p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleAddNew}
          className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black text-white shadow-lg hover:bg-slate-800 transition-all active:scale-95 gap-2 uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="px-2 lg:px-0">
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                        Stock Level
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                        Unit
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-slate-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                        <Archive className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-sm font-medium text-slate-900">No products</h3>
                        <p className="mt-1 text-sm text-slate-500">Get started by adding your first product.</p>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const isLowStock = product.quantity < product.min_quantity;
                      
                      return (
                        <tr key={product.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                            {product.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-slate-500">
                            {Number(product.quantity || 0).toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                            {product.unit}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                            {isLowStock ? (
                              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                Healthy
                              </span>
                            )}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end items-center gap-1">
                              <button
                                onClick={() => handleAddStock(product)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all active:scale-95 border border-emerald-200/50"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Restock
                              </button>
                              
                              <div className="h-4 w-px bg-slate-200 mx-1" />

                              <button
                                onClick={() => handleEdit(product)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Identity"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleAdjustStock(product)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Correction / Spoilage"
                              >
                                <Scale className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDelete(product.id, product.name)}
                                disabled={isDeleting === product.id}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
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

      <AddStockModal
        isOpen={stockModalOpen}
        onClose={() => {
          setStockModalOpen(false);
          setActiveProduct(null);
        }}
        storeSlug={storeSlug}
        product={activeProduct}
      />

      <StockAdjustmentModal
        isOpen={adjustmentModalOpen}
        onClose={() => {
          setAdjustmentModalOpen(false);
          setActiveProduct(null);
        }}
        storeSlug={storeSlug}
        product={activeProduct}
      />
    </>
  );
}
