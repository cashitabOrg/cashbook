'use client'

import { useState } from 'react'
import { Pencil, Trash2, X, AlertOctagon } from 'lucide-react'
import { toast } from 'sonner'
import { editSaleItem, deleteSaleItem } from '@/app/actions/sales'

interface EditSaleModalProps {
  itemId: string;
  initialQty: number;
  initialRevenue: number;
  productName: string;
}

export default function EditSaleModal({ itemId, initialQty, initialRevenue, productName }: EditSaleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [qty, setQty] = useState(initialQty);
  const [revenue, setRevenue] = useState(initialRevenue);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty < 0 || revenue < 0) {
      toast.error('Values cannot be negative.');
      return;
    }

    setIsSaving(true);
    const res = await editSaleItem(itemId, qty, revenue);
    setIsSaving(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Sale record updated successfully. Inventory reconciled.');
      setIsOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    const res = await deleteSaleItem(itemId);
    setIsSaving(false);

    if (res?.error) {
       toast.error(res.error);
       setConfirmDelete(false);
    } else {
       toast.success('Sale deleted perfectly. Stock refunded seamlessly.');
       setConfirmDelete(false);
       setIsOpen(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        title="Edit or Delete Transaction"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {isOpen && (
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
                 <div>
                    <p className="text-xs font-bold text-slate-700">{productName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Changing values will automatically reconcile store inventory.</p>
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
                      value={qty}
                      onChange={(e) => setQty(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Revenue (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={revenue}
                      onChange={(e) => setRevenue(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
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
      )}
    </>
  )
}
