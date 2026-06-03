"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, User, ChevronDown, ChevronUp } from "lucide-react";

type LedgerTransactionRowProps = {
  tx: any;
  idx: number;
};

export default function LedgerTransactionRow({ tx, idx }: LedgerTransactionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPositive = Number(tx.quantity_change) > 0;
  const isNegative = Number(tx.quantity_change) < 0;
  const changeColor = isNegative ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-400/10' : (isPositive ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10' : 'text-gray-500 dark:text-gray-400');
  const Icon = isNegative ? ArrowDownRight : ArrowUpRight;

  const transactionTypeBadgeColor = tx.transaction_type === 'SALE' 
    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
    : tx.transaction_type === 'SALE_EDIT'
    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    : tx.transaction_type === 'SALE_VOID'
    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    : tx.transaction_type === 'RESTOCK'
    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30';

  const productName = tx.products?.name || tx.product_name || "Unknown Product";

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 dark:border-[#2C2C2E] hover:bg-gray-50 dark:hover:bg-[#252528]/50 transition-colors items-center">
        
        {/* S/N */}
        <div className="col-span-1 text-gray-500 dark:text-gray-400 font-mono text-xs pl-2 font-bold bg-gray-50 dark:bg-[#252528] w-fit px-2 py-1 rounded-lg border border-gray-200 dark:border-[#3A3A3C]">
          #{idx + 1}
        </div>

        {/* Time */}
        <div className="col-span-2 text-gray-500 dark:text-gray-400 font-mono text-sm tracking-tighter">
          {new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        
        {/* Product & Note Context */}
        <div className="col-span-3 flex flex-col justify-center">
          <span className="font-semibold text-gray-900 dark:text-white">
            {productName}
            {!tx.products?.name && tx.product_name && (
              <span className="ml-2 text-[9px] bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-[#4A4A4C] font-bold uppercase">
                Deleted 
              </span>
            )}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${transactionTypeBadgeColor}`}>
              {tx.transaction_type.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate" title={tx.note}>{tx.note || "System Log"}</span>
          </div>
        </div>

        {/* Initial -> [Change] -> New  */}
        <div className="col-span-1 text-right text-gray-500 dark:text-gray-400 font-mono">
          {Number(tx.quantity_before).toFixed(2)}
        </div>
        <div className="col-span-2 flex justify-center">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold tracking-tight shadow-sm ${changeColor}`}>
            <Icon className="w-4 h-4" />
            {Number(tx.quantity_change) > 0 ? '+' : ''}{Number(tx.quantity_change).toFixed(2)}
          </div>
        </div>
        <div className="col-span-1 text-left text-gray-900 dark:text-white font-mono font-bold">
           {Number(tx.quantity_after).toFixed(2)}
        </div>

        {/* Authorization Context */}
        <div className="col-span-2 flex items-center gap-3 pl-4">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#252528] flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#3A3A3C]">
             <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium truncate">{tx.users?.full_name || "Auto System (Offline)"}</span>
        </div>

      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col border border-gray-100 dark:border-[#2C2C2E] rounded-lg mb-2 overflow-hidden bg-white dark:bg-[#1E1E20] shadow-sm transition-all mx-2">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-col p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252528]/50 gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 font-mono font-bold bg-gray-50 dark:bg-[#252528] px-1.5 py-0.5 rounded border border-gray-200 dark:border-[#3A3A3C]">
                #{idx + 1}
              </span>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {productName}
                {!tx.products?.name && tx.product_name && (
                  <span className="ml-2 text-[8px] bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-gray-400 px-1 py-0.5 rounded border border-gray-200 dark:border-[#4A4A4C] font-bold uppercase">
                    Del
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-bold text-xs ${changeColor}`}>
                <Icon className="w-3 h-3" />
                {isPositive ? '+' : ''}{Number(tx.quantity_change).toFixed(2)}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${transactionTypeBadgeColor}`}>
              {tx.transaction_type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 border-t border-gray-100 dark:border-[#2C2C2E] bg-gray-50 dark:bg-[#252528]/30">
            <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Time Recorded</span>
                <span className="text-gray-600 dark:text-gray-300 text-xs font-mono">
                  {new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Authorized By</span>
                <span className="text-gray-600 dark:text-gray-300 text-xs font-medium truncate flex items-center gap-1.5">
                  <User className="w-3 h-3 text-gray-400" />
                  {tx.users?.full_name || "Auto System"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Initial Stock</span>
                <span className="text-gray-500 dark:text-gray-400 font-mono text-xs font-bold">
                  {Number(tx.quantity_before).toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">New Total</span>
                <span className="text-gray-900 dark:text-white font-mono font-bold text-xs">
                  {Number(tx.quantity_after).toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col col-span-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Notes / Context</span>
                <span className="text-gray-500 dark:text-gray-400 text-xs italic break-words">
                  {tx.note || "No notes provided for this transaction."}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
