"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { X, PlusCircle, Scale, Settings, History, TrendingUp, PackagePlus, AlertTriangle } from "lucide-react";
import { addStock, adjustStock, editProduct, getPriceHistory } from "@/app/actions/products";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";

type ProductDetailsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  product: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    min_quantity: number;
    cost_price: number;
    selling_price: number;
  } | null;
};

const REASONS = [
  { id: "Spoiled", label: "Spoiled / Expired", color: "text-red-600", icon: <X className="w-3.5 h-3.5" /> },
  { id: "Damaged", label: "Damaged Stock", color: "text-orange-600", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { id: "Correction", label: "Inventory Correction (Error)", color: "text-blue-600", icon: <Scale className="w-3.5 h-3.5" /> },
  { id: "Other", label: "Other Loss / Gain", color: "text-slate-600", icon: <PackagePlus className="w-3.5 h-3.5" /> },
];

export default function ProductDetailsDrawer({
  isOpen,
  onClose,
  storeSlug,
  product,
}: ProductDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"restock" | "correction" | "identity" | "history">("restock");
  const [loading, setLoading] = useState(false);

  // Restock Form States
  const [restockQty, setRestockQty] = useState<number>(0);
  const [restockCost, setRestockCost] = useState<number>(product?.cost_price || 0);
  const [restockSelling, setRestockSelling] = useState<number>(product?.selling_price || 0);
  const [syncPrice, setSyncPrice] = useState(true);

  // Correction Form States
  const [correctMode, setCorrectMode] = useState<"minus" | "plus" | "set">("minus");
  const [correctValue, setCorrectValue] = useState<string>("");
  const [selectedReason, setSelectedReason] = useState(REASONS[0].id);

  // Identity Form States
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editMinQty, setEditMinQty] = useState(0);
  const [editCost, setEditCost] = useState(0);
  const [editSelling, setEditSelling] = useState(0);

  // Logs History States
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<{ priceLogs: any[]; restockLogs: any[]; adjustmentLogs: any[] } | null>(null);

  // Reset tab and states when a different product is selected
  useEffect(() => {
    if (isOpen && product) {
      setActiveTab("restock");
      
      // Restock values
      setRestockQty(0);
      setRestockCost(product.cost_price || 0);
      setRestockSelling(product.selling_price || 0);
      setSyncPrice(true);

      // Correction values
      setCorrectMode("minus");
      setCorrectValue("");
      setSelectedReason(REASONS[0].id);

      // Identity values
      setEditName(product.name || "");
      setEditUnit(product.unit || "");
      setEditMinQty(product.min_quantity || 0);
      setEditCost(product.cost_price || 0);
      setEditSelling(product.selling_price || 0);
    }
  }, [isOpen, product]);

  // Fetch History Logs
  useEffect(() => {
    if (isOpen && product && activeTab === "history") {
      setHistoryLoading(true);
      getPriceHistory(product.id).then((res) => {
        setHistoryData(res);
        setHistoryLoading(false);
      });
    }
  }, [isOpen, product, activeTab]);

  if (!product) return null;

  // Restock Calculations
  const totalInvestment = Number(restockQty || 0) * Number(restockCost || 0);
  const expectedRevenue = Number(restockQty || 0) * Number(restockSelling || 0);
  const projectedProfit = expectedRevenue - totalInvestment;
  const isPriceChanged = 
    (Number(restockCost) !== Number(product.cost_price || 0)) || 
    (Number(restockSelling) !== Number(product.selling_price || 0));

  // Correction Calculations
  const currentQty = Number(product.quantity || 0);
  const correctValNum = Number(correctValue || 0);
  let calculatedChange = 0;
  if (correctMode === "set") {
    calculatedChange = correctValNum - currentQty;
  } else if (correctMode === "minus") {
    calculatedChange = -Math.abs(correctValNum);
  } else {
    calculatedChange = Math.abs(correctValNum);
  }

  // Handle Restock Submit
  const handleRestockSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const quantity = Number(formData.get("quantityAdded"));

    if (quantity <= 0) {
      toast.error("Please enter a valid quantity greater than 0");
      setLoading(false);
      return;
    }

    formData.append("product_id", product.id);
    formData.append("syncPrice", (isPriceChanged && syncPrice).toString());

    const res = await addStock(storeSlug, formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Successfully added stock to ${product.name}`);
      onClose();
    }
    setLoading(false);
  };

  // Handle Correction Submit
  const handleCorrectionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (correctValNum === 0 || (correctMode === "set" && correctValNum === currentQty)) {
       toast.error("Please enter a valid correction quantity");
       return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const finalFormData = new FormData();
    finalFormData.append("product_id", product.id);
    finalFormData.append("quantityChange", calculatedChange.toString());
    finalFormData.append("reason", selectedReason);

    let finalNote = (formData.get("note") as string).trim();
    if (correctMode === "set") {
      const auditNote = `[Fridge Audit] Override from ${currentQty.toFixed(2)} to ${correctValNum.toFixed(2)}`;
      finalNote = finalNote ? `${finalNote} (${auditNote})` : auditNote;
    }
    finalFormData.append("note", finalNote);

    const res = await adjustStock(storeSlug, finalFormData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Inventory adjustments updated for ${product.name}`);
      onClose();
    }
    setLoading(false);
  };

  // Handle Identity Edit Submit
  const handleIdentitySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("id", product.id);
    formData.append("name", editName);
    formData.append("unit", editUnit);
    formData.append("minQuantity", editMinQty.toString());
    formData.append("costPrice", editCost.toString());
    formData.append("sellingPrice", editSelling.toString());

    const res = await editProduct(storeSlug, formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Catalog details updated for ${product.name}`);
      onClose();
    }
    setLoading(false);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col h-full border-l border-gray-200 dark:border-[#2C2C2E]">
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-gray-100 dark:border-[#2C2C2E] flex justify-between items-start shrink-0">
                    <div>
                      <Dialog.Title className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                        Product Details
                      </Dialog.Title>
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1 truncate max-w-[280px]">
                        {product.name}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#252528] rounded-xl transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="px-6 py-4 bg-gray-50/50 dark:bg-[#252528]/20 border-b border-gray-100 dark:border-[#2C2C2E] grid grid-cols-3 gap-2 shrink-0">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Stock Status</p>
                      <p className={`text-xs font-black ${product.quantity < product.min_quantity ? "text-red-500" : "text-gray-900 dark:text-gray-100"}`}>
                        {Number(product.quantity || 0).toFixed(2)} <span className="text-[9px] uppercase font-bold text-gray-400">{product.unit}</span>
                      </p>
                    </div>
                    <div className="text-center border-x border-gray-100 dark:border-[#2C2C2E]">
                      <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Unit Cost</p>
                      <p className="text-xs font-black text-gray-900 dark:text-gray-100">{formatCurrency(Number(product.cost_price || 0))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Retail Price</p>
                      <p className="text-xs font-black text-blue-600 dark:text-blue-400">{formatCurrency(Number(product.selling_price || 0))}</p>
                    </div>
                  </div>

                  {/* Vertical Tab Select Strip */}
                  <div className="flex bg-gray-100 dark:bg-[#252528] p-1 mx-6 mt-6 rounded-xl shrink-0 border border-gray-200/50 dark:border-[#3A3A3C]/50">
                    <button
                      onClick={() => setActiveTab("restock")}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === "restock" ? "bg-white dark:bg-[#3A3A3C] text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Restock
                    </button>
                    <button
                      onClick={() => setActiveTab("correction")}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === "correction" ? "bg-white dark:bg-[#3A3A3C] text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" /> Adjust
                    </button>
                    <button
                      onClick={() => setActiveTab("identity")}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === "identity" ? "bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setActiveTab("history")}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === "history" ? "bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <History className="w-3.5 h-3.5" /> Logs
                    </button>
                  </div>

                  {/* Drawer Scrollable Body Content */}
                  <div className="flex-1 overflow-y-auto p-6 min-h-0">
                    <div className="h-full">
                      {activeTab === "restock" && (
                        <form onSubmit={handleRestockSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> Restock / Purchase Inventory
                          </h4>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Qty</label>
                              <input
                                type="number"
                                name="quantityAdded"
                                required
                                min="0.01"
                                step="0.01"
                                value={restockQty || ""}
                                onChange={(e) => setRestockQty(Number(e.target.value))}
                                className="block w-full border border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#252528] rounded-xl px-2.5 py-2.5 text-xs text-gray-900 dark:text-white font-bold no-spinner text-center"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cost (₦)</label>
                              <input
                                type="number"
                                name="unitCost"
                                min="0"
                                step="0.01"
                                value={restockCost || ""}
                                onChange={(e) => setRestockCost(Number(e.target.value))}
                                className="block w-full border border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#252528] rounded-xl px-2.5 py-2.5 text-xs text-gray-900 dark:text-white font-bold no-spinner text-center"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Retail (₦)</label>
                              <input
                                type="number"
                                name="unitSelling"
                                min="0"
                                step="0.01"
                                value={restockSelling || ""}
                                onChange={(e) => setRestockSelling(Number(e.target.value))}
                                className="block w-full border border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#252528] rounded-xl px-2.5 py-2.5 text-xs text-gray-900 dark:text-white font-bold no-spinner text-center"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {isPriceChanged && (
                            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                              <input
                                type="checkbox"
                                id="syncPriceDrawer"
                                checked={syncPrice}
                                onChange={(e) => setSyncPrice(e.target.checked)}
                                className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                              />
                              <label htmlFor="syncPriceDrawer" className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight leading-tight cursor-pointer">
                                Update main catalog prices to new values: Cost ({formatCurrency(restockCost)}) & Retail ({formatCurrency(restockSelling)})
                              </label>
                            </div>
                          )}

                          {restockQty > 0 && (
                            <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-[#252528] border border-gray-100 dark:border-[#3A3A3C] rounded-xl text-[10px]">
                              <div>
                                <p className="font-bold text-gray-400 uppercase tracking-widest mb-0.5 ml-1">Investment</p>
                                <p className="font-black text-gray-900 dark:text-white ml-1">{formatCurrency(totalInvestment)}</p>
                              </div>
                              <div>
                                <p className="font-bold text-gray-400 uppercase tracking-widest mb-0.5 ml-1">Expected Rev</p>
                                <p className="font-black text-gray-900 dark:text-white ml-1">{formatCurrency(expectedRevenue)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-400 uppercase tracking-widest mb-0.5 pr-1">Profit</p>
                                <p className={`font-black pr-1 ${projectedProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                  {formatCurrency(projectedProfit)}
                                </p>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Note (Optional)</label>
                            <textarea
                              name="note"
                              rows={2}
                              className="w-full bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-[11px] font-bold text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#1C1C1E] outline-none transition-all resize-none placeholder:text-gray-400"
                              placeholder="e.g. Restock from Supplier A"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {loading ? "Confirming..." : "Confirm Stock Increase"}
                          </button>
                        </form>
                      )}

                      {activeTab === "correction" && (
                        <form onSubmit={handleCorrectionSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-500" /> Correct Stock Level (Inventory Audit)
                          </h4>

                          <div className="flex p-1 bg-gray-100 dark:bg-[#252528] rounded-xl">
                            <button
                              type="button"
                              onClick={() => setCorrectMode("minus")}
                              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                correctMode === "minus" ? "bg-white dark:bg-[#3A3A3C] text-red-600 shadow-sm" : "text-gray-500 dark:text-gray-400 font-bold"
                              }`}
                            >
                              Subtract (-)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCorrectMode("plus")}
                              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                correctMode === "plus" ? "bg-white dark:bg-[#3A3A3C] text-emerald-600 shadow-sm" : "text-gray-500 dark:text-gray-400 font-bold"
                              }`}
                            >
                              Add (+)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCorrectMode("set")}
                              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                correctMode === "set" ? "bg-white dark:bg-[#3A3A3C] text-indigo-600 shadow-sm" : "text-gray-500 dark:text-gray-400 font-bold"
                              }`}
                            >
                              Set (Fridge)
                            </button>
                          </div>

                          <div>
                            <label className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                              {correctMode === "set" ? "Exact Count found in Fridge" : "Correction Quantity"}
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={correctValue}
                              onChange={(e) => setCorrectValue(e.target.value)}
                              className="block w-full border border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#252528] rounded-xl px-4 py-3 text-xs text-gray-900 dark:text-white font-black placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white border-2"
                              placeholder="0.00"
                            />
                            {correctValNum > 0 && (
                              <p className={`mt-2 ml-1 text-[9px] font-bold ${calculatedChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {correctMode === "set" ? (
                                  <>Stock level will {calculatedChange >= 0 ? "increase" : "decrease"} by {Math.abs(calculatedChange).toFixed(2)} units.</>
                                ) : (
                                  <>Current level {currentQty.toFixed(2)} → New level {(currentQty + calculatedChange).toFixed(2)}</>
                                )}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Reason for correction</label>
                            <div className="grid grid-cols-2 gap-2">
                              {REASONS.map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => setSelectedReason(r.id)}
                                  className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all text-left ${
                                    selectedReason === r.id 
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-400 font-bold"
                                    : "border-gray-100 dark:border-[#252528] bg-gray-50 dark:bg-[#252528]/50 hover:border-gray-200 dark:hover:border-[#3A3A3C]"
                                  }`}
                                >
                                  <div className={`${r.color} p-1 bg-white dark:bg-[#1C1C1E] rounded-md shadow-sm`}>{r.icon}</div>
                                  <span className="text-[9px] truncate">{r.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Audit Note (Optional)</label>
                            <textarea
                              name="note"
                              rows={2}
                              className="w-full bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-[11px] font-bold text-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#1C1C1E] outline-none transition-all resize-none placeholder:text-gray-400"
                              placeholder="Describe why this adjustment is required..."
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={loading || (correctMode === "set" && correctValNum === currentQty)}
                            className={`w-full py-4 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                              calculatedChange < 0 ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                            }`}
                          >
                            {loading ? "Submitting..." : "Submit Inventory Correction"}
                          </button>
                        </form>
                      )}

                      {activeTab === "identity" && (
                        <form onSubmit={handleIdentitySubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Settings className="w-4 h-4 text-gray-700 dark:text-gray-400" /> Edit Catalog Details
                          </h4>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Product Name</label>
                              <input
                                type="text"
                                required
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="block w-full border border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#252528] rounded-xl px-4 py-3 text-xs text-gray-900 dark:text-white font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Unit</label>
                                <input
                                  type="text"
                                  required
                                  value={editUnit}
                                  onChange={(e) => setEditUnit(e.target.value)}
                                  className="block w-full border border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#252528] rounded-xl px-4 py-3 text-xs text-gray-900 dark:text-white font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white text-center"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Min Threshold</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={editMinQty}
                                  onChange={(e) => setEditMinQty(Number(e.target.value))}
                                  className="block w-full border border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#252528] rounded-xl px-4 py-3 text-xs text-gray-900 dark:text-white font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white text-center no-spinner"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Cost Price (₦)</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={editCost}
                                  onChange={(e) => setEditCost(Number(e.target.value))}
                                  className="block w-full border border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#252528] rounded-xl px-4 py-3 text-xs text-gray-900 dark:text-white font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white text-center no-spinner"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Retail Price (₦)</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={editSelling}
                                  onChange={(e) => setEditSelling(Number(e.target.value))}
                                  className="block w-full border border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#252528] rounded-xl px-4 py-3 text-xs text-gray-900 dark:text-white font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white text-center no-spinner"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                          >
                            {loading ? "Saving..." : "Save Catalog Updates"}
                          </button>
                        </form>
                      )}

                      {activeTab === "history" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <History className="w-4 h-4 text-blue-600 dark:text-blue-500" /> Transaction & Audit Logs
                          </h4>

                          {historyLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                              <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Loading Logs...</p>
                            </div>
                          ) : (
                            <div className="space-y-6 text-xs">
                              {/* Price Changes */}
                              <div>
                                <p className="font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Price Audits</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {historyData?.priceLogs.length === 0 ? (
                                    <p className="text-[10px] text-gray-500 italic py-2 pl-1">No price history found.</p>
                                  ) : (
                                    historyData?.priceLogs.map((log: any) => (
                                      <div key={log.id} className="p-3 bg-gray-50 dark:bg-[#252528] rounded-xl border border-gray-100 dark:border-[#3A3A3C] shadow-sm text-[10px] flex justify-between items-start">
                                        <div className="space-y-0.5">
                                          <div className="flex gap-2">
                                            <span>Cost: {formatCurrency(log.old_cost)}➔{formatCurrency(log.new_cost)}</span>
                                            <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                                            <span className="text-blue-600 dark:text-blue-400">Retail: {formatCurrency(log.old_selling)}➔{formatCurrency(log.new_selling)}</span>
                                          </div>
                                          <p className="text-[8px] text-gray-400 font-medium">By {log.users?.full_name || 'Admin'}</p>
                                        </div>
                                        <span className="text-[8px] text-gray-400">{format(new Date(log.created_at), "MM/dd HH:mm")}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Restocks */}
                              <div>
                                <p className="font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><PlusCircle className="w-3.5 h-3.5 text-emerald-500" /> Restocks</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border-l-2 border-gray-100 dark:border-[#2C2C2E] ml-2 pl-3">
                                  {historyData?.restockLogs.length === 0 ? (
                                    <p className="text-[10px] text-gray-500 italic py-2">No acquisitions recorded.</p>
                                  ) : (
                                    historyData?.restockLogs.map((log: any) => (
                                      <div key={log.id} className="relative text-[10px] pb-4 last:pb-0">
                                        <div className="absolute -left-[17px] top-1 w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 border border-white dark:border-[#1C1C1E]" />
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-black text-gray-800 dark:text-white">+{log.quantity_added} units added</p>
                                            <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold">Cost: {formatCurrency(log.unit_cost)}</p>
                                            {log.note && <p className="text-[9px] text-gray-400 italic">"{log.note}"</p>}
                                          </div>
                                          <span className="text-[8px] text-gray-400">{format(new Date(log.created_at), "MM/dd")}</span>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Corrections */}
                              <div>
                                <p className="font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-indigo-500" /> Corrections</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {historyData?.adjustmentLogs.length === 0 ? (
                                    <p className="text-[10px] text-gray-500 italic py-2 pl-1">No adjustments found.</p>
                                  ) : (
                                    historyData?.adjustmentLogs.map((log: any) => (
                                      <div key={log.id} className="p-3 bg-gray-50 dark:bg-[#252528] rounded-xl border border-gray-100 dark:border-[#3A3A3C] shadow-sm text-[10px]">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                                            Number(log.quantity_change) < 0 ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                          }`}>
                                            {log.reason} ({log.quantity_change > 0 ? '+' : ''}{log.quantity_change})
                                          </span>
                                          <span className="text-[8px] text-gray-400">{format(new Date(log.created_at), "MM/dd")}</span>
                                        </div>
                                        {log.note && <p className="text-[9px] italic text-gray-500 dark:text-gray-400 mt-1">"{log.note}"</p>}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
