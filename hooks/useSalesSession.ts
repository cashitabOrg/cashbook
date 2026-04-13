import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export type SaleRow = {
  localId: string; // for UI iteration
  dbId?: string; // assigned when synced
  productId: string;
  productName: string;
  quantitySold: number | string;
  subtotal: number | string;
  synced: boolean;
};

export function useSalesSession(storeSlug: string, storeId: string, managerId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [committingIds, setCommittingIds] = useState<Set<string>>(new Set());
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [orphanedSession, setOrphanedSession] = useState<any | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // 1. Fetching logic refactored for re-use
  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sale_items')
      .select('id, product_id, quantity, subtotal, created_at, products(name)')
      .order('created_at', { ascending: true })
      .eq('session_id', sessionId);
      
    if (data && !error) {
      // Find which of our local rows are still pending in the queue
      const pendingQueueItems = await db.offlineQueue
        .filter(q => q.type === 'sale_item' && q.status === 'pending')
        .toArray();
      const pendingLocalIds = pendingQueueItems.map(q => q.payload?.local_row_id);

      setRows(prevRows => {
        const existingRows: SaleRow[] = data.map((item: any) => {
          const existing = prevRows.find(r => r.dbId === item.id);
          return {
            localId: existing ? existing.localId : crypto.randomUUID(),
            dbId: item.id,
            productId: item.product_id,
            productName: item.products?.name || 'Unknown',
            quantitySold: Number(item.quantity),
            subtotal: Number(item.subtotal),
            synced: true
          };
        });

        // Keep unsynced drafting rows
        const draftingRows = prevRows.filter(r => !r.synced);
        
        // Keep synced rows that are STILL in the offline queue (not yet in Supabase)
        const pendingOfflineRows = prevRows.filter(r => r.synced && pendingLocalIds.includes(r.localId));
        
        return [...existingRows, ...pendingOfflineRows, ...draftingRows];
      });
    }
  }, [sessionId]);

  useEffect(() => {
    const savedSessionId = localStorage.getItem(`session_${managerId}_${storeId}`);
    const savedStart = localStorage.getItem(`session_start_${managerId}_${storeId}`);

    if (savedSessionId) {
      setSessionId(savedSessionId);

      // Restore rows from local storage immediately
      const savedRowsStr = localStorage.getItem(`session_rows_${managerId}_${storeId}`);
      if (savedRowsStr) {
        try {
          const parsed = JSON.parse(savedRowsStr);
          if (Array.isArray(parsed)) {
            setRows(parsed);
          }
        } catch(e) {
          console.error("Failed to parse saved session rows", e);
        }
      }

      // Check if session is from a previous day (WAT)
      if (savedStart) {
        const todayWAT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());
        const sessionDateWAT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date(savedStart));
        
        if (todayWAT !== sessionDateWAT) {
          setIsStale(true);
        } else {
          setIsStale(false);
        }
      }
    } else {
      setIsStale(false);
      
      // If no local session found, check Supabase for any 'open' sessions for this manager
      // This handles cases where localStorage was cleared but the session is still open in DB.
      if (storeId && managerId && navigator.onLine) {
        const checkCloudSession = async () => {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('sales_sessions')
            .select('*')
            .eq('store_id', storeId)
            .eq('manager_id', managerId)
            .eq('status', 'open')
            .maybeSingle();

          if (data && !error) {
            setOrphanedSession(data);
          }
        };
        checkCloudSession();
      }
    }
  }, [managerId, storeId]);

  // Save rows to localStorage whenever they change
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(`session_rows_${managerId}_${storeId}`, JSON.stringify(rows));
    }
  }, [rows, sessionId, managerId, storeId]);

  // Handle re-fetch when session ID becomes available 
  useEffect(() => {
    if (sessionId && navigator.onLine) {
      refreshSession();
    }
  }, [sessionId, refreshSession]);

  // Check network status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const totalRevenue = rows.reduce((acc, row) => acc + (parseFloat(row.subtotal.toString()) || 0), 0);
  const totalItems = rows.reduce((acc, row) => acc + (parseFloat(row.quantitySold.toString()) || 0), 0);

  const startSession = async () => {
    setIsStarting(true);
    // Offline-first: generate UUID and queue
    const sessionUuid = crypto.randomUUID();
    const now = new Date().toISOString();
    
    setSessionId(sessionUuid);
    setIsStale(false);
    localStorage.setItem(`session_${managerId}_${storeId}`, sessionUuid);
    localStorage.setItem(`session_start_${managerId}_${storeId}`, now);

    await db.offlineQueue.add({
      store_id: storeId,
      type: 'sale_session',
      payload: { id: sessionUuid, manager_id: managerId, started_at: now },
      created_at: Date.now(),
      status: 'pending'
    });
    
    // Optionally trigger sync via engineService.processQueue() if imported, 
    // but SyncEngine's interval/online handler catches it.
    
    setIsStarting(false);
    setRows([]);
  };

  const addEmptyRow = () => {
    setRows(prev => [...prev, {
      localId: crypto.randomUUID(),
      productId: '',
      productName: '',
      quantitySold: '',
      subtotal: '',
      synced: false
    }]);
  };

  const updateRow = async (localId: string, field: keyof SaleRow, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.localId !== localId) return row;
      return { ...row, [field]: value };
    }));
  };

  const commitRow = async (row: SaleRow) => {
    const qty = parseFloat(row.quantitySold.toString());
    const sub = parseFloat(row.subtotal.toString());

    if (!sessionId || !row.productId || isNaN(qty) || isNaN(sub)) return;
    
    // PREVENTION: Prevent duplicate commits if row is already synced or already in process
    if (row.synced || row.dbId || committingIds.has(row.localId)) {
      console.warn("Prevention: Row already committed or currently in process.");
      return; 
    }

    setCommittingIds(prev => new Set(prev).add(row.localId));

    // 1. Validation: Check available stock in Dexie Before Committing
    const p = await db.products.get(row.productId);
    if (!p || p.quantity < qty) {
       toast.error(`Insufficient stock for ${row.productName || 'this product'}`, {
         description: `Available: ${p?.quantity?.toFixed(2) || '0.00'} | Requested: ${qty.toFixed(2)}`
       });
       return;
    }
    
    const payload = {
      store_id: storeId,
      session_id: sessionId,
      product_id: row.productId,
      quantity: qty,
      subtotal: sub,
      unit_price: p.selling_price || 0, // Transaction snapshot
      unit_cost: p.cost_price || 0,   // Transaction snapshot
    };

    // Offline-first: Always queue offline
    await db.offlineQueue.add({
      store_id: storeId,
      type: 'sale_item',
      payload: { ...payload, local_row_id: row.localId },
      created_at: Date.now(),
      status: 'pending'
    });
    
    // 2. The stock decrement is now handled automatically by the Database Trigger on the server.
    // We already adjust the local Dexie product cache below for instant UI feedback.
    
    // Locally adjust Dexie cache instantly for realtime UI feedback
    if (p) {
       await db.products.update(p.id, { quantity: p.quantity - qty });
    }

    setRows(prev => prev.map(r => r.localId === row.localId ? { ...r, synced: true } : r));
    setCommittingIds(prev => {
      const next = new Set(prev);
      next.delete(row.localId);
      return next;
    });
  };

  const removeRow = async (localId: string) => {
    const row = rows.find(r => r.localId === localId);
    if (!row) return;

    const qty = parseFloat(row.quantitySold.toString());

    if (row.synced && row.productId && !isNaN(qty)) {
      // 2. The stock refund is now handled automatically by the Database Trigger on the server
      // whenever a sale_item is removed/deleted.
      
      // Queue a deletion in the cloud
      await db.offlineQueue.add({
        store_id: storeId,
        type: 'sale_item_delete',
        payload: { local_row_id: localId },
        created_at: Date.now(),
        status: 'pending'
      });

      // Locally restore Dexie cache instantly
      const p = await db.products.get(row.productId);
      if (p) {
         await db.products.update(p.id, { quantity: p.quantity + qty });
      }
    }

    setRows(prev => prev.filter(r => r.localId !== localId));
  };

  const uncommitRow = async (localId: string) => {
    const row = rows.find(r => r.localId === localId);
    const qty = row ? parseFloat(row.quantitySold.toString()) : NaN;
    if (!row || !row.synced || !row.productId || isNaN(qty)) return;

    // Remove the sale item from the queue safely if it matches our localId
    await db.offlineQueue.filter(item => item.payload?.local_row_id === localId).delete();

    // Refund the stock locally
    const p = await db.products.get(row.productId);
    if (p) {
        await db.products.update(p.id, { quantity: p.quantity + qty });
    }

    // Queue a deletion in the cloud (in case it already synced)
    await db.offlineQueue.add({
      store_id: storeId,
      type: 'sale_item_delete',
      payload: { local_row_id: localId },
      created_at: Date.now(),
      status: 'pending'
    });

    // 2. The stock refund is handled by the server trigger if the sale already synced.
    // If it hasn't synced, we simply deleted it from the queue above.

    setRows(prev => prev.map(r => r.localId === localId ? { ...r, synced: false, dbId: undefined } : r));
  };

  const endSession = async () => {
    if (!sessionId) return;
    setIsEnding(true);

    // Offline-first
    await db.offlineQueue.add({
      store_id: storeId,
      type: 'sale_session',
      payload: { id: sessionId, action: 'close', ended_at: new Date().toISOString(), total_revenue: totalRevenue },
      created_at: Date.now(),
      status: 'pending'
    });

    setSessionId(null);
    setIsStale(false);
    localStorage.removeItem(`session_${managerId}_${storeId}`);
    localStorage.removeItem(`session_start_${managerId}_${storeId}`);
    localStorage.removeItem(`session_rows_${managerId}_${storeId}`);
    setRows([]);
    setIsEnding(false);
  };

  const restoreOrphanedSession = async () => {
    if (!orphanedSession) return;
    setIsRecovering(true);
    
    const { id, started_at } = orphanedSession;
    setSessionId(id);
    localStorage.setItem(`session_${managerId}_${storeId}`, id);
    localStorage.setItem(`session_start_${managerId}_${storeId}`, started_at);
    
    // Trigger a refresh to get the items
    const supabase = createClient();
    const { data } = await supabase
      .from('sale_items')
      .select('id, product_id, quantity, subtotal, created_at, products(name)')
      .order('created_at', { ascending: true })
      .eq('session_id', id);

    if (data) {
        const restoredRows = data.map((item: any) => ({
            localId: crypto.randomUUID(),
            dbId: item.id,
            productId: item.product_id,
            productName: item.products?.name || 'Unknown',
            quantitySold: Number(item.quantity),
            subtotal: Number(item.subtotal),
            synced: true
        }));
        setRows(restoredRows);
        localStorage.setItem(`session_rows_${managerId}_${storeId}`, JSON.stringify(restoredRows));
    }

    setOrphanedSession(null);
    setIsRecovering(false);
    toast.success("Session recovered successfully");
  };

  const closeOrphanedSession = async () => {
    if (!orphanedSession) return;
    setIsRecovering(true);
    const supabase = createClient();
    
    // We queue it for safety but also attempt immediate cloud update
    const { error } = await supabase
      .from('sales_sessions')
      .update({ status: 'closed', ended_at: new Date().toISOString() })
      .eq('id', orphanedSession.id);

    if (error) {
       // If cloud update fails, we can't easily queue it without a proper payload in this hook's context
       // but SyncEngine usually handles 'sale_session' with 'action: close'.
       await db.offlineQueue.add({
         store_id: storeId,
         type: 'sale_session',
         payload: { id: orphanedSession.id, action: 'close', ended_at: new Date().toISOString(), total_revenue: 0 },
         created_at: Date.now(),
         status: 'pending'
       });
    }

    setOrphanedSession(null);
    setIsRecovering(false);
    toast.info("Previous session closed. You can now start a new one.");
  };

  return {
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
  };
}
