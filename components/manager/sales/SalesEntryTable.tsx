import { AlertCircle, Pencil, Search, Trash2, X, Plus } from "lucide-react";
import EditSaleModal from "../../admin/EditSaleModal";
import { SaleRow } from "@/hooks/useSalesSession";
import { formatCurrency } from "@/lib/format";

type SalesEntryTableProps = {
  rows: SaleRow[];
  products: any[];
  showValidationErrors: boolean;
  handleOpenPicker: (rowId: string) => void;
  updateRow: (id: string, field: keyof SaleRow, value: any) => Promise<void>;
  commitRow: (row: SaleRow) => void;
  uncommitRow: (id: string) => void;
  removeRow: (id: string) => void;
  refreshSession: () => void;
  addEmptyRow: () => void;
  editLocalRow: (localId: string, productId: string, qty: number, subtotal: number) => Promise<void>;
  stickyTop?: number;
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
  addEmptyRow,
  editLocalRow,
  stickyTop = 68
}: SalesEntryTableProps) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] lg:rounded-2xl lg:shadow-xl lg:shadow-slate-200/40 lg:border border-slate-200 dark:border-[#2C2C2E] flex-1 flex flex-col min-h-[500px]">
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block overflow-x-auto flex-1 lg:rounded-2xl">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/95 dark:bg-[#252528]/95 backdrop-blur-sm border-b border-slate-100 dark:border-[#2C2C2E] sticky z-20" style={{ top: stickyTop }}>
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-white sm:pl-6 w-12 text-center">#</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white w-1/3">Product</th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 dark:text-white">Qty Sold</th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 dark:text-white w-32">Total Price</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 w-32">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#2C2C2E] bg-white dark:bg-[#1C1C1E]">
            {rows.map((row, index) => {
              const selectedProduct = products.find(p => p.id === row.productId);
              
              return (
                <tr key={row.localId} className={`transition-all duration-200 ${row.synced ? "bg-slate-50 dark:bg-[#252528]/50 dark:bg-[#252528]/50 opacity-80" : "hover:bg-slate-50 dark:bg-[#252528] focus-within:bg-blue-50 dark:bg-blue-500/10/60 focus-within:ring-inset focus-within:ring-1 focus-within:ring-blue-100"}`}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-500 dark:text-gray-400 sm:pl-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{index + 1}</span>
                      {!row.synced && showValidationErrors && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 dark:text-white">
                    {row.synced ? (
                      <div className="flex items-center gap-2">
                         <span className="font-bold text-slate-900 dark:text-white">{row.productName}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenPicker(row.localId)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg border-2 transition-all flex items-center justify-between group ${
                          row.productId ? "bg-white dark:bg-[#1C1C1E] border-blue-100 text-slate-900 dark:text-white shadow-sm" : "bg-slate-50 dark:bg-[#252528] border-slate-200 dark:border-[#2C2C2E] text-slate-500 dark:text-gray-400 hover:border-blue-300"
                        }`}
                      >
                        <span className={`${row.productId ? "font-bold" : "font-medium"}`}>
                          {row.productName || "Choose product..."}
                        </span>
                        <Search className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 group-hover:text-blue-500" />
                      </button>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 dark:text-white text-right">
                    <div className="relative rounded-xl shadow-sm flex items-center justify-end group/qty">
                      <input
                        type="number"
                        disabled={row.synced || !row.productId}
                        min="0.01"
                        max={selectedProduct ? selectedProduct.quantity : undefined}
                        step="0.01"
                        value={row.quantitySold}
                        onChange={(e) => updateRow(row.localId, "quantitySold", e.target.value)}
                        onBlur={() => { if (!row.synced && row.productId && row.subtotal && row.quantitySold) commitRow(row) }}
                        className="block w-full rounded-xl border-2 border-slate-200 dark:border-[#2C2C2E] py-3 pl-4 pr-14 text-right text-slate-900 dark:text-white shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 sm:text-sm font-mono font-bold transition-all disabled:opacity-50 disabled:bg-slate-100 dark:bg-[#2C2C2E] no-spinner"
                        placeholder="0.00"
                      />
                      {selectedProduct?.unit && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest group-focus-within/qty:text-blue-600 dark:text-blue-400 transition-colors">
                            {selectedProduct.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 dark:text-white text-right w-32">
                    <div className="relative rounded-xl shadow-sm flex items-center justify-end group/price">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-slate-400 dark:text-gray-500 text-xs font-black group-focus-within/price:text-emerald-600 dark:text-emerald-400 transition-colors">₦</span>
                      </div>
                      <input
                        type="number"
                        disabled={row.synced || !row.productId}
                        min="0"
                        step="0.01"
                        value={row.subtotal}
                        onChange={(e) => updateRow(row.localId, "subtotal", e.target.value)}
                        onBlur={() => { if (!row.synced && row.productId && row.subtotal && row.quantitySold) commitRow(row) }}
                        className="block w-full rounded-xl border-2 border-slate-200 dark:border-[#2C2C2E] py-3 pl-8 pr-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:text-sm transition-all disabled:opacity-50 disabled:bg-slate-100 dark:bg-[#2C2C2E] no-spinner"
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {row.synced ? (
                      <div className="flex items-center justify-end gap-2 pr-2">
                        <EditSaleModal 
                          itemId={row.dbId}
                          localId={row.localId}
                          productId={row.productId}
                          initialQty={Number(row.quantitySold)} 
                          initialRevenue={Number(row.subtotal)} 
                          productName={selectedProduct?.name || row.productName || "Product"} 
                          availableProducts={products.map(p => ({ id: p.id, name: p.name }))}
                          onSuccess={refreshSession}
                          onSaveLocal={async (pid, qty, sub) => {
                            await editLocalRow(row.localId, pid, qty, sub);
                          }}
                          onDeleteLocal={async () => {
                            await removeRow(row.localId);
                          }}
                        />
                        <span className="sr-only">Saved</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => removeRow(row.localId)}
                        className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-500/10 p-1.5 rounded disabled:opacity-50"
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
              <td colSpan={6} className="px-6 py-4 bg-slate-50 dark:bg-[#252528]/50 dark:bg-[#252528]/50 border-t border-slate-100 dark:border-[#2C2C2E]">
                <div className="flex justify-end">
                  <button
                    onClick={addEmptyRow}
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Row
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden flex-1 flex flex-col overflow-x-hidden">

        {/* Mobile Row Map */}
        <div className="divide-y divide-slate-100 dark:divide-[#2C2C2E]">
          {rows.map((row, index) => {
            const selectedProduct = products.find(p => p.id === row.productId);

            return (
              <div 
                key={row.localId}
                className={`grid items-center p-3 gap-2 transition-all duration-200 border-l-2 ${
                  row.synced 
                    ? "bg-slate-50/40 dark:bg-[#252528]/10 border-l-emerald-500" 
                    : "bg-white dark:bg-[#1C1C1E] border-l-blue-500 focus-within:bg-blue-50/30 dark:focus-within:bg-blue-500/5"
                }`}
                style={{ gridTemplateColumns: "4.2fr 3.3fr 3.5fr 1.2fr" }}
              >
                {/* Product Name / Picker Button */}
                <div className="flex flex-col min-w-0 justify-center">
                  {row.synced ? (
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {row.productName}
                    </span>
                  ) : (
                    <div className="relative flex items-center gap-1 w-full">
                      {showValidationErrors && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                      )}
                      <button
                        onClick={() => handleOpenPicker(row.localId)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg border transition-all flex items-center justify-between group ${
                          row.productId 
                            ? "bg-white dark:bg-[#1C1C1E] border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white shadow-sm" 
                            : "bg-slate-50 dark:bg-[#252528] border-slate-200 dark:border-[#2C2C2E] text-slate-500 dark:text-gray-400 hover:border-blue-400"
                        }`}
                      >
                        <span className={`truncate text-[11px] ${row.productId ? "font-bold" : "font-medium"}`}>
                          {row.productName || "Choose..."}
                        </span>
                        <Search className="w-3 h-3 text-slate-400 dark:text-gray-500 group-hover:text-blue-500 shrink-0 ml-1" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Quantity Sold */}
                <div className="flex flex-col min-w-0 justify-center">
                  {row.synced ? (
                    <div className="text-right text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {Number(row.quantitySold).toFixed(2)}
                      <span className="text-[8px] text-slate-400 dark:text-gray-500 uppercase font-medium ml-0.5">{selectedProduct?.unit || ''}</span>
                    </div>
                  ) : (
                    <div className="relative rounded-lg shadow-sm flex items-center justify-end group/qty w-full">
                      <input
                        type="number"
                        disabled={row.synced || !row.productId}
                        min="0.01"
                        max={selectedProduct ? selectedProduct.quantity : undefined}
                        step="0.01"
                        value={row.quantitySold}
                        onChange={(e) => updateRow(row.localId, "quantitySold", e.target.value)}
                        onBlur={() => { if (!row.synced && row.productId && row.subtotal && row.quantitySold) commitRow(row) }}
                        className="block w-full rounded-lg border border-slate-200 dark:border-[#2C2C2E] py-1.5 pl-2 pr-10 text-right text-slate-900 dark:text-white shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-500/10 text-xs font-mono font-bold transition-all disabled:opacity-50 disabled:bg-slate-100 dark:bg-[#2C2C2E] no-spinner"
                        placeholder="0.00"
                      />
                      {selectedProduct?.unit && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                          <span className="text-slate-400 dark:text-gray-500 text-[8px] font-black uppercase tracking-tight group-focus-within/qty:text-blue-600 dark:text-blue-400 transition-colors">
                            {selectedProduct.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Total Price */}
                <div className="flex flex-col min-w-0 justify-center">
                  {row.synced ? (
                    <div className="text-right text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.subtotal)}
                    </div>
                  ) : (
                    <div className="relative rounded-lg shadow-sm flex items-center justify-end group/price w-full">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                        <span className="text-slate-400 dark:text-gray-500 text-[10px] font-black group-focus-within/price:text-emerald-600 dark:text-emerald-400 transition-colors">₦</span>
                      </div>
                      <input
                        type="number"
                        disabled={row.synced || !row.productId}
                        min="0"
                        step="0.01"
                        value={row.subtotal}
                        onChange={(e) => updateRow(row.localId, "subtotal", e.target.value)}
                        onBlur={() => { if (!row.synced && row.productId && row.subtotal && row.quantitySold) commitRow(row) }}
                        className="block w-full rounded-lg border border-slate-200 dark:border-[#2C2C2E] py-1.5 pl-4 pr-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 text-xs transition-all disabled:opacity-50 disabled:bg-slate-100 dark:bg-[#2C2C2E] no-spinner"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end min-w-0">
                  {row.synced ? (
                    <EditSaleModal 
                      itemId={row.dbId}
                      localId={row.localId}
                      productId={row.productId}
                      initialQty={Number(row.quantitySold)} 
                      initialRevenue={Number(row.subtotal)} 
                      productName={selectedProduct?.name || row.productName || "Product"} 
                      availableProducts={products.map(p => ({ id: p.id, name: p.name }))}
                      onSuccess={refreshSession}
                      onSaveLocal={async (pid, qty, sub) => {
                        await editLocalRow(row.localId, pid, qty, sub);
                      }}
                      onDeleteLocal={async () => {
                        await removeRow(row.localId);
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => removeRow(row.localId)}
                      className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-500/10 p-1 rounded disabled:opacity-50 shrink-0"
                      title="Remove row"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Add Row Button Area */}
        <div className="p-3 bg-slate-50 dark:bg-[#252528]/20 border-t border-slate-100 dark:border-[#2C2C2E] flex items-center justify-end">
          <button
            onClick={addEmptyRow}
            className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3.5 py-2 rounded-xl transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>
      </div>
    </div>
  );
}
