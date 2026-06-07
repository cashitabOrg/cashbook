"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import LedgerToolbar from "./ledger/LedgerToolbar";
import LedgerDayGroup from "./ledger/LedgerDayGroup";
import { fetchLedgerData, type LedgerTransaction, type LedgerProduct } from "@/app/actions/ledger";

export default function LedgerClient({
  storeId,
  searchQuery,
}: {
  storeId: string;
  searchQuery: string;
}) {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [products, setProducts] = useState<LedgerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "SALES" | "STOCK">("ALL");
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

  // Fetch all ledger data client-side to avoid RSC serialization crashes
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchLedgerData(storeId);
      setTransactions(result.transactions);
      setProducts(result.products);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription: instantly prepend new inventory movements
  useEffect(() => {
    if (!storeId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`ledger-movements-${storeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'inventory_movements',
        filter: `store_id=eq.${storeId}`,
      }, (payload) => {
        const row = payload.new as any;
        const tx: LedgerTransaction = {
          id: String(row.id ?? ''),
          store_id: String(row.store_id ?? ''),
          product_id: row.product_id ? String(row.product_id) : null,
          transaction_type: String(row.transaction_type ?? ''),
          quantity_before: Number(row.quantity_before ?? 0),
          quantity_change: Number(row.quantity_change ?? 0),
          quantity_after: Number(row.quantity_after ?? 0),
          reference_id: row.reference_id ? String(row.reference_id) : null,
          note: row.note ? String(row.note) : null,
          actor_id: row.actor_id ? String(row.actor_id) : null,
          created_at: String(row.created_at ?? ''),
          product_name: null,
          product_unit: null,
          staff_name: null,
          products: null,
          users: null,
        };
        setTransactions(prev => [tx, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId]);

  const toggleDay = (dateLabel: string) => {
    setOpenDays(prev => ({ ...prev, [dateLabel]: !prev[dateLabel] }));
  };

  // 1. Core Filtering Engine
  const filteredData = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeTab === "SALES" && tx.transaction_type !== "SALE") return false;
      if (activeTab === "STOCK" && tx.transaction_type === "SALE") return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const pName = (tx.products?.name || tx.product_name || "").toLowerCase();
        const uName = (tx.users?.full_name || tx.staff_name || "").toLowerCase();
        const note = (tx.note || "").toLowerCase();
        if (!pName.includes(query) && !uName.includes(query) && !note.includes(query)) return false;
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  // 2. Grouping Engine — flat list → day-by-day nested arrays
  const groupedByDay = useMemo(() => {
    const groups: { dateLabel: string; items: LedgerTransaction[] }[] = [];
    const map = new Map<string, LedgerTransaction[]>();

    filteredData.forEach(tx => {
      const dateLabel = new Date(tx.created_at).toLocaleDateString("en-US", {
        weekday: 'long', month: 'long', day: 'numeric'
      });
      if (!map.has(dateLabel)) {
        map.set(dateLabel, []);
        groups.push({ dateLabel, items: map.get(dateLabel)! });
      }
      map.get(dateLabel)!.push(tx);
    });

    return groups;
  }, [filteredData]);

  return (
    <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl flex flex-col transition-colors">
      <LedgerToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-medium">Loading movement log…</p>
          </div>
        ) : groupedByDay.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <ShieldAlert className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-xl font-medium text-gray-900 dark:text-white">No Stock Movements Found</p>
            <p className="text-sm mt-2">No transactions match these filters.</p>
          </div>
        ) : (
          <div className="w-full md:min-w-[1000px]">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 dark:border-[#2C2C2E] bg-gray-50/80 dark:bg-[#252528]/80 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest sticky top-0 backdrop-blur-md z-10 transition-colors">
              <div className="col-span-1 pl-2">S/N</div>
              <div className="col-span-2">Time Recorded</div>
              <div className="col-span-3">Item &amp; Context</div>
              <div className="col-span-1 text-right">Initial</div>
              <div className="col-span-2 text-center text-gray-700 dark:text-gray-300 font-black">DELTA ( ± )</div>
              <div className="col-span-1 text-left">New Total</div>
              <div className="col-span-2 pl-4">Staff Authorized By</div>
            </div>

            {groupedByDay.map((group) => (
              <LedgerDayGroup
                key={group.dateLabel}
                group={group}
                isOpen={openDays[group.dateLabel] || false}
                onToggle={toggleDay}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
