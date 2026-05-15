import { Search, X } from "lucide-react";
import { SaleRow } from "@/hooks/useCorrectionSession";

type CorrectionTableRowProps = {
  row: SaleRow;
  index: number;
  products: any[];
  handleOpenPicker: (id: string) => void;
  updateRow: (id: string, field: keyof SaleRow, val: any) => void;
  removeRow: (id: string) => void;
};

export default function CorrectionTableRow({
  row,
  index,
  products,
  handleOpenPicker,
  updateRow,
  removeRow
}: CorrectionTableRowProps) {
  const selectedProduct = products.find(p => p.id === row.productId);
  
  return (
    <tr>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-center">{index + 1}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
          <button
            onClick={() => handleOpenPicker(row.localId)}
            className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all flex items-center justify-between group ${
              row.productId ? "bg-white border-purple-300 text-slate-900 shadow-sm" : "bg-white border-slate-300 text-slate-700 hover:border-purple-500"
            }`}
          >
            <span className="font-black">
              {row.productName || "Type to Select Product..."}
            </span>
            <Search className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
          </button>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <input
            type="number"
            disabled={!row.productId}
            min="0.01"
            value={row.quantitySold}
            onChange={(e) => updateRow(row.localId, "quantitySold", parseFloat(e.target.value) || '')}
            className="block w-24 border-2 border-slate-300 rounded-lg px-3 py-2 text-right text-slate-900 font-black bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all disabled:opacity-30"
            placeholder="0.00"
          />
          <span className="text-xs font-bold text-slate-500 w-8 text-left">{selectedProduct?.unit || ''}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-right">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₦</span>
          <input
            type="number"
            disabled={!row.productId}
            value={row.subtotal}
            onChange={(e) => updateRow(row.localId, "subtotal", parseFloat(e.target.value) || '')}
            className="block w-full border-2 border-slate-300 rounded-lg pl-7 pr-3 py-2 text-right text-purple-700 font-black bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all disabled:opacity-30"
            placeholder="0.00"
          />
        </div>
      </td>
      <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right">
          <button onClick={() => removeRow(row.localId)} className="text-red-500 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
      </td>
    </tr>
  );
}
