"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, History, Download, Package, ShoppingBag, Sparkles } from "lucide-react";
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

  const totalCostValue = products.reduce((acc, curr) => acc + (curr.quantity * (curr.cost_price || 0)), 0);
  const totalSellingValue = products.reduce((acc, curr) => acc + (curr.quantity * (curr.selling_price || 0)), 0);
  const potentialProfit = totalSellingValue - totalCostValue;

  const fmt = (n: number) =>
    "₦" + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full px-2 lg:px-0 pb-1 lg:pb-0">
        {/* 1 — Stock Cost */}
        <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-4 p-2 sm:p-4 md:p-5 w-full">
          <div className="bg-amber-100 dark:bg-amber-500/10 p-1.5 sm:p-3 rounded-xl shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-tight whitespace-nowrap">
              Stock Cost
            </p>
            <div className="text-sm sm:text-base md:text-xl font-semibold mt-0.5 truncate">
              {fmt(totalCostValue)}
            </div>
          </div>
        </Card>

        {/* 2 — Retail Value */}
        <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-4 p-2 sm:p-4 md:p-5 w-full">
          <div className="bg-sky-100 dark:bg-sky-500/10 p-1.5 sm:p-3 rounded-xl shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-tight whitespace-nowrap">
              Retail Value
            </p>
            <div className="text-sm sm:text-base md:text-xl font-semibold mt-0.5 truncate">
              {fmt(totalSellingValue)}
            </div>
          </div>
        </Card>

        {/* 3 — Est. Profit */}
        <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-4 p-2 sm:p-4 md:p-5 w-full">
          <div className="bg-emerald-100 dark:bg-emerald-500/10 p-1.5 sm:p-3 rounded-xl shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-tight whitespace-nowrap">
              Est. Profit
            </p>
            <div className="text-sm sm:text-base md:text-xl font-semibold mt-0.5 text-emerald-600 truncate">
              {fmt(potentialProfit)}
            </div>
          </div>
        </Card>
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
                    <td className="py-3 px-4 text-right text-xs text-gray-500 dark:text-gray-400">{formatCurrency((product.cost_price || 0))}</td>
                    <td className="py-3 px-4 text-right text-xs font-black text-amber-500 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10">{formatCurrency(costVal)}</td>
                    <td className="py-3 px-4 text-right text-xs text-gray-500 dark:text-gray-400">{formatCurrency((product.selling_price || 0))}</td>
                    <td className="py-3 px-4 text-right text-xs font-black text-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10">{formatCurrency(sellVal)}</td>
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
                    <td className="py-3 px-4 text-right text-sm font-black text-amber-500 dark:text-amber-400">{formatCurrency(totalCostValue)}</td>
                    <td></td>
                    <td className="py-3 px-4 text-right text-sm font-black text-blue-500 dark:text-blue-400">{formatCurrency(totalSellingValue)}</td>
                    <td></td>
                </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden flex flex-col gap-3 mt-1">
          {products.length === 0 ? (
            <div className="py-12 text-center border rounded-lg border-gray-200 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E]">
              <Package className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">No products</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Get started by adding your first product.</p>
            </div>
          ) : (
            <>
              {/* Mobile Column Headers */}
              <div 
                className="grid items-center bg-transparent border border-transparent p-3 gap-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
                style={{ gridTemplateColumns: "3.8fr 3.6fr 3.6fr 1fr" }}
              >
                <div className="text-left">Product</div>
                <div className="text-right">Cost</div>
                <div className="text-right">Retail</div>
                <div className="text-right">Hist</div>
              </div>

              {products.map((product) => {
                const costVal = product.quantity * (product.cost_price || 0);
                const sellVal = product.quantity * (product.selling_price || 0);

                // Helper to format currency and remove trailing .00 for space-efficiency
                const fmtMobile = (val: number) => formatCurrency(val).replace(/\.00$/, "");

                return (
                  <div 
                    key={product.id} 
                    className="grid items-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-xl shadow-sm p-3 gap-2 transition-colors"
                    style={{ gridTemplateColumns: "3.8fr 3.6fr 3.6fr 1fr" }}
                  >
                    {/* Name & Quantity */}
                    <div className="flex flex-col min-w-0 justify-center">
                      <span className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate" title={product.name}>
                        {product.name}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-bold mt-1">
                        {Number(product.quantity || 0).toFixed(2)}
                        <span className="text-[8px] text-gray-400 uppercase font-medium ml-0.5">{product.unit}</span>
                      </span>
                    </div>

                    {/* Cost Value */}
                    <div className="flex flex-col justify-center text-right min-w-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black font-mono text-amber-500 dark:text-amber-400 truncate w-full">
                          <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight mr-1">Total:</span>
                          {fmtMobile(costVal)}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 dark:text-gray-400 truncate w-full mt-0.5">
                          <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight mr-1">Unit:</span>
                          {fmtMobile(product.cost_price)}/{product.unit}
                        </span>
                      </div>
                    </div>

                    {/* Retail Value */}
                    <div className="flex flex-col justify-center text-right min-w-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black font-mono text-blue-600 dark:text-blue-400 truncate w-full">
                          <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight mr-1">Total:</span>
                          {fmtMobile(sellVal)}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 dark:text-gray-400 truncate w-full mt-0.5">
                          <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight mr-1">Unit:</span>
                          {fmtMobile(product.selling_price)}/{product.unit}
                        </span>
                      </div>
                    </div>

                    {/* History Action */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setSelectedProductId(product.id)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-all active:scale-95 border border-transparent shrink-0"
                        title="View Pricing History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <PriceHistoryModal 
        productId={selectedProductId} 
        onClose={() => setSelectedProductId(null)} 
      />
    </div>
  );
}
