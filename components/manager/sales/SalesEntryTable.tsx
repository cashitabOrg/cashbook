import { AlertCircle, Pencil, Search, Trash2, X, Plus } from "lucide-react";
import EditSaleModal from "../../admin/EditSaleModal";
import { SaleRow } from "@/hooks/useSalesSession";

type SalesEntryTableProps = {
  rows: SaleRow[];
  products: any[];
  showValidationErrors: boolean;
  handleOpenPicker: (rowId: string) => void;
  updateRow: (id: string, field: string, value: any) => void;
  commitRow: (row: SaleRow) => void;
  uncommitRow: (id: string) => void;
  removeRow: (id: string) => void;
  refreshSession: () => void;
  addEmptyRow: () => void;
};

export default function SalesEntryTable({
  rows,
  products,
  showValidationErrors,
  handleOpenPicker,
  updateRow,
  commitRow,
  uncommitRow,
  removeRow,
  refreshSession,
  addEmptyRow
}: SalesEntryTableProps) {
  return (
    <div className="bg-white lg:rounded-2xl lg:shadow-xl lg:shadow-slate-200/40 lg:border border-slate-200 flex-1 flex flex-col min-h-[500px]">
      <div className="overflow-x-auto flex-1 lg:rounded-2xl">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6 w-12 text-center">#</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 w-1/3">Product</th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">Qty Sold</th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 w-32">Total Price</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 w-32">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, index) => {
              const selectedProduct = products.find(p => p.id === row.productId);
              
              return (
                <tr key={row.localId} className={`transition-all duration-200 ${row.synced ? "bg-slate-50/50 opacity-80" : "hover:bg-slate-50 focus-within:bg-blue-50/60 focus-within:ring-inset focus-within:ring-1 focus-within:ring-blue-100"}`}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-500 sm:pl-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{index + 1}</span>
                      {!row.synced && showValidationErrors && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900">
                    {row.synced ? (
                      <div className="flex items-center gap-2">
                         <span className="font-bold text-slate-900">{row.productName}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenPicker(row.localId)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg border-2 transition-all flex items-center justify-between group ${
                          row.productId ? "bg-white border-blue-100 text-slate-900 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300"
                        }`}
                      >
                        <span className={`${row.productId ? "font-bold" : "font-medium"}`}>
                          {row.productName || "Choose product..."}
                        </span>
                        <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                      </button>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 text-right">
                    <div className="flex items-center justify-end gap-2 group/qty">
                      <input
                        type="number"
                        disabled={row.synced || !row.productId}
                        min="0.01"
                        max={selectedProduct ? selectedProduct.quantity : undefined}
                        step="0.01"
                        value={row.quantitySold}
                        onChange={(e) => updateRow(row.localId, "quantitySold", e.target.value)}
                        onBlur={() => { if (!row.synced && row.productId && row.subtotal && row.quantitySold) commitRow(row) }}
                        className="block w-28 rounded-xl border-2 border-slate-200 py-3 pr-4 text-right text-slate-900 shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-mono font-bold transition-all disabled:opacity-50 disabled:bg-slate-100 no-spinner"
                        placeholder="0.00"
                      />
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest w-8 text-left group-focus-within/qty:text-blue-600 transition-colors">{selectedProduct?.unit || ''}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 text-right w-32">
                    <div className="relative rounded-xl shadow-sm flex items-center justify-end group/price">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-slate-400 text-xs font-black group-focus-within/price:text-emerald-600 transition-colors">₦</span>
                      </div>
                      <input
                        type="number"
                        disabled={row.synced || !row.productId}
                        min="0"
                        step="0.01"
                        value={row.subtotal}
                        onChange={(e) => updateRow(row.localId, "subtotal", e.target.value)}
                        onBlur={() => { if (!row.synced && row.productId && row.subtotal && row.quantitySold) commitRow(row) }}
                        className="block w-full rounded-xl border-2 border-slate-200 py-3 pl-8 pr-4 text-right font-mono font-bold text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:text-sm transition-all disabled:opacity-50 disabled:bg-slate-100 no-spinner"
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {row.synced ? (
                      <div className="flex items-center justify-end gap-2 pr-2">
                         {row.dbId ? (
                           <EditSaleModal 
                              itemId={row.dbId} 
                              initialQty={Number(row.quantitySold)} 
                              initialRevenue={Number(row.subtotal)} 
                              productName={selectedProduct?.name || "Product"} 
                              onSuccess={refreshSession}
                           />
                         ) : (
                           <div className="flex items-center gap-1">
                             <button
                               onClick={() => uncommitRow(row.localId)}
                               className="text-amber-500 hover:text-amber-700 bg-amber-50 p-1.5 rounded transition-colors"
                               title="Edit recent sale"
                             >
                               <Pencil className="w-5 h-5" />
                             </button>
                             <button
                               onClick={() => removeRow(row.localId)}
                               className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded transition-colors"
                               title="Delete recent sale"
                             >
                               <Trash2 className="w-5 h-5" />
                             </button>
                           </div>
                         )}
                         <span className="sr-only">Saved</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => removeRow(row.localId)}
                        className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded disabled:opacity-50"
                        title="Remove row"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {/* Add Row Button Area */}
            <tr>
              <td colSpan={6} className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                <button
                  onClick={addEmptyRow}
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
