'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Trash2, X, AlertOctagon } from 'lucide-react'
import { toast } from 'sonner'
import { editSaleItem, deleteSaleItem } from '@/app/actions/sales'
import { formatCurrency } from "@/lib/format";

interface EditSaleModalProps {
  itemId?: string;
  localId?: string;
  productId?: string;
  initialQty: number;
  initialRevenue: number;
  productName: string;
  availableProducts?: { id: string; name: string }[];
  onSuccess?: () => void;
  onSaveLocal?: (productId: string, qty: number, subtotal: number) => Promise<void>;
  onDeleteLocal?: () => Promise<void>;
}

export default function EditSaleModal({ 
  itemId, 
  localId, 
  productId, 
  initialQty, 
  initialRevenue, 
  productName, 
  availableProducts = [], 
  onSuccess,
  onSaveLocal,
  onDeleteLocal
}: EditSaleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const sanQty = isNaN(Number(initialQty)) ? 0 : Number(initialQty);
  const sanRev = isNaN(Number(initialRevenue)) ? 0 : Number(initialRevenue);

  const [qty, setQty] = useState(sanQty);
  const [revenue, setRevenue] = useState(sanRev);
  const [selectedProductId, setSelectedProductId] = useState(productId || '');
  const [isSaving, setIsSaving] = useState(false);

  // Derive unit price from sanitized values for auto-recalculation
  const unitPrice = sanQty > 0 ? sanRev / sanQty : 0;

  const handleQtyChange = (newQty: number) => {
    setQty(newQty);
    // Auto-recalculate revenue based on original unit price
    if (unitPrice > 0) {
      setRevenue(parseFloat((newQty * unitPrice).toFixed(2)));
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) {
      toast.error('Quantity sold must be a positive number.');
      return;
    }
    if (revenue <= 0) {
      toast.error('Total price must be a positive number.');
      return;
    }

    setIsSaving(true);
    if (onSaveLocal) {
      // Local/Offline mode (preferred for offline-first sales point)
      try {
        await onSaveLocal(selectedProductId, qty, revenue);
        toast.success('Local sale record updated successfully.');
        setIsOpen(false);
        onSuccess?.();
      } catch (err: any) {
        toast.error(err.message || 'Failed to update local record.');
      } finally {
        setIsSaving(false);
      }
    } else if (itemId) {
      // Cloud mode (fallback for history logs)
      const res = await editSaleItem(itemId, qty, revenue, selectedProductId);
      setIsSaving(false);

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Sale record updated successfully. Inventory reconciled.');
        setIsOpen(false);
        onSuccess?.();
      }
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    if (onDeleteLocal) {
      // Local/Offline mode (preferred for offline-first sales point)
      try {
        await onDeleteLocal();
        toast.success('Local sale record removed.');
        setConfirmDelete(false);
        setIsOpen(false);
        onSuccess?.();
      } catch (err: any) {
         toast.error(err.message || 'Failed to delete local record.');
      } finally {
         setIsSaving(false);
      }
    } else if (itemId) {
      // Cloud mode (fallback for history logs)
      const res = await deleteSaleItem(itemId);
      setIsSaving(false);

      if (res?.error) {
         toast.error(res.error);
         setConfirmDelete(false);
      } else {
         toast.success('Sale deleted perfectly. Stock refunded seamlessly.');
         setConfirmDelete(false);
         setIsOpen(false);
         onSuccess?.();
      }
    }
  };

  const modalContent = isOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-lg">Edit Transaction</h3>
          <button onClick={() => { setIsOpen(false); setConfirmDelete(false); }} className="text-slate-400 hover:text-slate-600 focus:outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-5 bg-blue-50/50 border border-blue-100 p-3 rounded-lg flex items-start gap-3">
             <div className="bg-white p-1.5 rounded shadow-sm text-blue-600 shrink-0">
                <Pencil className="w-4 h-4" />
             </div>
             <div className="w-full">
                {availableProducts && availableProducts.length > 0 ? (
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 p-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs font-bold text-slate-700">{productName}</p>
                )}
                <p className="text-[10px] text-slate-500 mt-1">Changing this product will automatically re-allocate inventory.</p>
             </div>
          </div>

          {!confirmDelete ? (
            <form onSubmit={handleEdit} className="space-y-4">
               <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Sold</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={isNaN(qty) ? "" : qty}
                  onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-mono font-bold text-slate-900 no-spinner"
                  required
                />
                {unitPrice > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">Unit price: {formatCurrency(unitPrice)} · Revenue updates automatically</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Revenue (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={isNaN(revenue) ? "" : revenue}
                  onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm font-mono font-bold text-emerald-700 no-spinner"
                  required
                />
              </div>
              
              <div className="pt-4 flex items-center justify-between gap-3">
                <button 
                   type="button" 
                   onClick={() => setConfirmDelete(true)}
                   disabled={isSaving}
                   className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                   title="Delete Transaction"
                >
                   <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex gap-2 w-full justify-end">
                  <button 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save Edit'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-xl text-center">
               <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto mb-3" />
               <h4 className="text-sm font-bold text-rose-900 mb-1">Delete Transaction?</h4>
               <p className="text-xs text-rose-700 mb-5">This will completely remove this sales record and refund the stock.</p>
               
               <div className="flex gap-2 w-full justify-center">
                  <button 
                    type="button" 
                    onClick={() => setConfirmDelete(false)}
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? 'Deleting...' : 'Yes, Delete It'}
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        title="Edit or Delete Transaction"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {mounted && typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent}
    </>
  );
}
