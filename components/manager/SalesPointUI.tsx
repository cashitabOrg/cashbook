"use client";

import { useState, useEffect } from "react";
import { useSalesSession, SaleRow } from "@/hooks/useSalesSession";
import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalProduct } from "@/lib/db";
import { useRealtimeStock } from "@/hooks/useRealtimeStock";
import ProductPickerModal from "./ProductPickerModal";
import { toast } from "sonner";
import SalesSessionState from "./sales/SalesSessionState";
import SalesTopBanner from "./sales/SalesTopBanner";
import SalesSummaryBar from "./sales/SalesSummaryBar";
import SalesEntryTable from "./sales/SalesEntryTable";

export default function SalesPointUI({
  storeSlug,
  storeId,
  managerId,
  initialProducts,
}: {
  storeSlug: string;
  storeId: string;
  managerId: string;
  initialProducts: any[];
}) {
  // 1. Listen to realtime changes from Supabase (mutates Dexie)
  useRealtimeStock(storeId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // 2. Hydrate Dexie cache initially if online
  useEffect(() => {
    async function syncProductsAndCleanup() {
      if (!initialProducts || initialProducts.length === 0) return;

      try {
        // --- One-Time Force Reset Switch ---
        // Ensuring all clients get a clean slate after the version upgrade
        const RESET_FLAG = 'frozenpos_cache_reset_v2';
        if (!localStorage.getItem(RESET_FLAG)) {
          console.log('[SalesPointUI] Performing one-time cache reset for version upgrade...');
          await db.products.clear();
          localStorage.setItem(RESET_FLAG, 'true');
        }

        // 1. Aggressive Cross-Store Cleanup
        // Delete ANY product from local Dexie that doesn't match this store's ID 
        // OR is not in the master list for this store. This prevents leakage 
        // from other sessions or devices.
        await db.products
          .where('store_id')
          .notEqual(storeId)
          .delete();

        const currentIds = initialProducts.map(p => p.id);
        const staleProducts = await db.products
          .where('store_id')
          .equals(storeId)
          .toArray();
        
        const idsToDelete = staleProducts
          .filter(p => !currentIds.includes(p.id))
          .map(p => p.id);

        if (idsToDelete.length > 0) {
          await db.products.bulkDelete(idsToDelete);
        }

        // 2. Update/Add current products
        await db.products.bulkPut(
          initialProducts.map(p => ({
            id: p.id,
            store_id: p.store_id || storeId,
            name: p.name,
            unit: p.unit,
            quantity: p.quantity,
            min_quantity: p.min_quantity || 0,
            cost_price: Number(p.cost_price || 0),
            selling_price: Number(p.selling_price || 0),
            last_synced: Date.now()
          }))
        );
      } catch (err) {
        console.error("Initial product hydration failed:", err);
      }
    }

    syncProductsAndCleanup();
  }, [initialProducts, storeId]);

  // 3. Reactively read products from Dexie and sort A-Z
  const liveProducts = useLiveQuery(
    () => db.products.where('store_id').equals(storeId).toArray(),
    [storeId]
  );

  const rawProducts = liveProducts || initialProducts || [];
  
  // 4. Strict filtering and Deduplication by Name (CASE INSENSITIVE) + Unit
  // We prioritize products that are in the initialProducts list (server-verified)
  const products = [...rawProducts].reduce((acc: any[], current) => {
    // Sanitize name: remove non-printable chars and extra spaces to catch hidden duplicates
    const sanitize = (s: string) => (s || "").replace(/[^\x20-\x7E]/g, '').trim().toLowerCase();
    
    const nameKey = sanitize(current.name);
    const unitKey = sanitize(current.unit);
    
    const existingIdx = acc.findIndex(p => 
      sanitize(p.name) === nameKey && 
      sanitize(p.unit) === unitKey
    );

    if (existingIdx === -1) {
      acc.push(current);
    } else {
      // Overwrite/Merge logic
      const existing = acc[existingIdx];
      const isNewVerified = initialProducts.some(p => p.id === current.id);
      const isOldVerified = initialProducts.some(p => p.id === existing.id);
      
      // If one of them is verified by the server initially, always prefer its ID and state
      if (isNewVerified && !isOldVerified) {
        acc[existingIdx] = current;
      } else if (!isNewVerified && isOldVerified) {
        // Keep existing
      } else {
        // Both or neither are verified, prefer most recently synced
        if ((current.last_synced || 0) > (existing.last_synced || 0)) {
          acc[existingIdx] = current;
        }
      }
    }
    return acc;
  }, []).sort((a, b) => a.name.localeCompare(b.name));

  // 4. Listen to offline queue count for sync feedback
  const pendingSyncCount = useLiveQuery(
    () => db.offlineQueue.filter(item => item.status === 'pending' || item.status === 'syncing').count(),
    []
  ) ?? 0;

  const {
    isOnline,
    sessionId,
    isStarting,
    isEnding,
    isStale,
    orphanedSession,
    isRecovering,
    rows,
    totalRevenue,
    totalItems,
    startSession,
    addEmptyRow,
    updateRow,
    commitRow,
    removeRow,
    uncommitRow,
    endSession,
    refreshSession,
    restoreOrphanedSession,
    closeOrphanedSession
  } = useSalesSession(storeSlug, storeId, managerId);

  const handleOpenPicker = (rowId: string) => {
    setActiveRowId(rowId);
    setPickerOpen(true);
  };

  const handleSelectProduct = (product: LocalProduct) => {
    if (activeRowId) {
      updateRow(activeRowId, "productId", product.id);
      updateRow(activeRowId, "productName", product.name);
    }
    setPickerOpen(false);
    setActiveRowId(null);
  };

  const handleEndSession = () => {
    const incompleteRows = rows.filter(r => !r.synced);
    if (incompleteRows.length > 0) {
      setShowValidationErrors(true);
      // Find 1-indexed positions for messaging
      const indices = rows
        .map((r, i) => (!r.synced ? i + 1 : -1))
        .filter(i => i !== -1);
      
      toast.error("Cannot End Session", {
        description: `Row(s) #${indices.join(", ")} are not filled correctly. Please complete them or remove them using the red X.`,
        duration: 5000
      });
      return;
    }
    endSession();
  };

  // A simple product search capability within the dropdown could be built natively 
  // with a datalist or custom combobox. For simplicity we use a select, but real 
  // world would use headlessui combobox.
  
  if (!sessionId) {
    return (
      <SalesSessionState 
        sessionId={sessionId}
        orphanedSession={orphanedSession}
        isRecovering={isRecovering}
        isStarting={isStarting}
        isOnline={isOnline}
        startSession={startSession}
        restoreOrphanedSession={restoreOrphanedSession}
        closeOrphanedSession={closeOrphanedSession}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] w-full max-w-7xl mx-auto lg:px-8 lg:py-6 lg:h-auto">
      <SalesTopBanner isOnline={isOnline} isStale={isStale} />

      <SalesSummaryBar 
        totalItems={totalItems}
        totalRevenue={totalRevenue}
        pendingSyncCount={pendingSyncCount}
        isEnding={isEnding}
        handleEndSession={handleEndSession}
      />

      <div className="flex-1 overflow-visible flex flex-col mb-24 lg:mb-0 px-2 lg:px-0">
        <SalesEntryTable 
          rows={rows}
          products={products}
          showValidationErrors={showValidationErrors}
          handleOpenPicker={handleOpenPicker}
          updateRow={updateRow}
          commitRow={commitRow}
          uncommitRow={uncommitRow}
          removeRow={removeRow}
          refreshSession={refreshSession}
          addEmptyRow={addEmptyRow}
        />

        <ProductPickerModal 
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handleSelectProduct}
          products={products}
        />
      </div>
    </div>
  );
}
