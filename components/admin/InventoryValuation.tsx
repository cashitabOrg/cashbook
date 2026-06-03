"use client";

import { useState } from "react";
import { Calculator, TrendingUp, History, Download, DollarSign, Package, ChevronDown, ChevronUp } from "lucide-react";
import PriceHistoryModal from "./PriceHistoryModal";

type Product = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
};

export default function InventoryValuation({ 
  products 
}: { 
  products: Product[] 
}) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalCostValue = products.reduce((acc, curr) => acc + (curr.quantity * (curr.cost_price || 0)), 0);
  const totalSellingValue = products.reduce((acc, curr) => acc + (curr.quantity * (curr.selling_price || 0)), 0);
  const potentialProfit = totalSellingValue - totalCostValue;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] p-5 rounded-2xl shadow-sm dark:shadow-2xl flex items-center gap-4 transition-colors">
          <div className="bg-gray-100 dark:bg-[#252528] p-3 rounded-xl text-amber-500">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total Stock Cost</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">₦{totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] p-5 rounded-2xl shadow-sm dark:shadow-2xl flex items-center gap-4 transition-colors">
          <div className="bg-gray-100 dark:bg-[#252528] p-3 rounded-xl text-blue-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total Retail Value</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">₦{totalSellingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] p-5 rounded-2xl shadow-sm dark:shadow-2xl flex items-center gap-4 transition-colors">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Potential Profit</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">₦{potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Main Valuation Table */}
      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-2xl shadow-sm dark:shadow-2xl overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2C2C2E] bg-gray-50 dark:bg-[#252528] flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Detailed Stock Valuation (Store Book)</h3>
            </div>
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                <Download className="w-3 h-3" />
                Export Ledger
            </button>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2C2C2E]">
            <thead className="bg-gray-50 dark:bg-[#252528]">
              <tr>
                <th className="py-3 px-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest w-12">S/N</th>
                <th className="py-3 px-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Product</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Quantity</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Unit Cost</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-amber-50/30 dark:bg-amber-500/10">Value (Cost)</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Unit Selling</th>
                <th className="py-3 px-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-blue-50/30 dark:bg-blue-500/10">Value (Selling)</th>
                <th className="py-3 px-4 text-center text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest w-20">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2C2C2E] bg-white dark:bg-[#1C1C1E]">
              {products.map((product, idx) => {
                const costVal = product.quantity * (product.cost_price || 0);
                const sellVal = product.quantity * (product.selling_price || 0);
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-[#2C2C2E]/50 transition-colors group">
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 font-mono italic">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-200">{product.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Per {product.unit}</p>
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono text-gray-500 dark:text-gray-400">{Number(product.quantity || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-xs text-gray-500 dark:text-gray-400">₦{(product.cost_price || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-xs font-black text-amber-500 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10">₦{costVal.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-xs text-gray-500 dark:text-gray-400">₦{(product.selling_price || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-xs font-black text-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10">₦{sellVal.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => setSelectedProductId(product.id)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-all"
                        title="View Pricing History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-[#252528] text-gray-900 dark:text-white border-t-2 border-gray-200 dark:border-[#2C2C2E]">
                <tr>
                    <td colSpan={2} className="py-3 px-4 text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Grand Totals</td>
                    <td className="py-3 px-4 text-right text-sm font-black text-gray-900 dark:text-white">{products.reduce((a,c) => a + Number(c.quantity), 0).toFixed(2)} Units</td>
                    <td></td>
                    <td className="py-3 px-4 text-right text-sm font-black text-amber-500 dark:text-amber-400">₦{totalCostValue.toFixed(2)}</td>
                    <td></td>
                    <td className="py-3 px-4 text-right text-sm font-black text-blue-500 dark:text-blue-400">₦{totalSellingValue.toFixed(2)}</td>
                    <td></td>
                </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden flex flex-col divide-y divide-gray-200 dark:divide-[#2C2C2E]">
          {products.map((product, idx) => {
            const costVal = product.quantity * (product.cost_price || 0);
            const sellVal = product.quantity * (product.selling_price || 0);
            const isExpanded = expandedId === product.id;

            return (
              <div key={product.id} className="flex flex-col bg-white dark:bg-[#1C1C1E] hover:bg-gray-50 dark:hover:bg-[#252528]/50 transition-colors">
                <div 
                  onClick={() => setExpandedId(prev => prev === product.id ? null : product.id)}
                  className="flex items-center justify-between p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-mono font-bold bg-gray-50 dark:bg-[#252528] px-1.5 py-0.5 rounded border border-gray-200 dark:border-[#3A3A3C]">#{idx + 1}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{product.name}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{Number(product.quantity || 0).toFixed(2)} {product.unit}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-[#252528]/30 p-3 rounded-xl border border-gray-100 dark:border-[#2C2C2E]">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Unit Cost</span>
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-300">₦{(product.cost_price || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5 text-amber-500">Total Cost</span>
                        <span className="text-xs font-black font-mono text-amber-500 dark:text-amber-400">₦{costVal.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Unit Selling</span>
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-300">₦{(product.selling_price || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5 text-blue-500">Total Selling</span>
                        <span className="text-xs font-black font-mono text-blue-500 dark:text-blue-400">₦{sellVal.toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedProductId(product.id)}
                      className="w-full flex justify-center items-center gap-2 py-2 text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-all active:scale-95 border border-blue-100 dark:border-blue-500/20"
                    >
                      <History className="w-3.5 h-3.5" />
                      View Pricing History
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Mobile Footer for Grand Totals */}
          <div className="bg-gray-50 dark:bg-[#252528] p-4 flex flex-col gap-2 border-t-2 border-gray-200 dark:border-[#2C2C2E]">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center mb-1">Grand Totals</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center p-2 bg-amber-50/50 dark:bg-amber-500/10 rounded-lg border border-amber-100/50 dark:border-amber-500/20">
                <span className="text-[9px] text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider font-bold mb-0.5">Total Cost</span>
                <span className="text-sm font-black font-mono text-amber-500 dark:text-amber-400">₦{totalCostValue.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-blue-50/50 dark:bg-blue-500/10 rounded-lg border border-blue-100/50 dark:border-blue-500/20">
                <span className="text-[9px] text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider font-bold mb-0.5">Total Selling</span>
                <span className="text-sm font-black font-mono text-blue-500 dark:text-blue-400">₦{totalSellingValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PriceHistoryModal 
        productId={selectedProductId} 
        onClose={() => setSelectedProductId(null)} 
      />
    </div>
  );
}
