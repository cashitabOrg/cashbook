import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { deleteSalesSession } from '@/app/actions/sales';

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
      .eq('session_id', sessionId)
      .eq('is_deleted', false);
      
    if (data && !error) {
      // Find which of our local rows are still pending in the queue (pending or currently syncing)
      const pendingQueueItems = await db.offlineQueue
        .filter(q => q.type === 'sale_item' && (q.status === 'pending' || q.status === 'syncing'))
        .toArray();
      const pendingLocalIds = pendingQueueItems.map(q => q.payload?.local_row_id);

      // Find which rows have pending deletions in the queue
      const pendingDeletes = await db.offlineQueue
        .filter(q => q.type === 'sale_item_delete' && (q.status === 'pending' || q.status === 'syncing'))
        .toArray();
      const deletedLocalIds = pendingDeletes.map(q => q.payload?.local_row_id);

      setRows(prevRows => {
        const existingRows: SaleRow[] = data
          .filter((item: any) => {
            const existing = prevRows.find(r => r.dbId === item.id);
            const isPendingDelete = deletedLocalIds.includes(item.id) || (existing ? deletedLocalIds.includes(existing.localId) : false);
            return !isPendingDelete;
          })
          .map((item: any) => {
            const existing = prevRows.find(r => r.dbId === item.id);
            
            // Check if there is a pending edit in the offline queue for this item
            const pendingEdit = pendingQueueItems.find(q => 
              q.payload?.local_row_id === item.id || 
              (existing ? q.payload?.local_row_id === existing.localId : false)
            );

            if (pendingEdit) {
              return {
                localId: existing ? existing.localId : crypto.randomUUID(),
                dbId: item.id,
                productId: pendingEdit.payload.product_id,
                productName: existing ? existing.productName : 'Unknown',
                quantitySold: Number(pendingEdit.payload.quantity),
                subtotal: Number(pendingEdit.payload.subtotal),
                synced: true
              };
            }

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
        // Only keep local rows that are marked synced but have not been assigned a dbId yet
        const pendingOfflineRows = prevRows.filter(r => r.synced && !r.dbId && pendingLocalIds.includes(r.localId));
        
        const combined = [...existingRows, ...pendingOfflineRows, ...draftingRows];
        if (combined.length === 0) {
          return [{
            localId: crypto.randomUUID(),
            productId: '',
            productName: '',
            quantitySold: '',
            subtotal: '',
            synced: false
          }];
        }
        return combined;
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
      let rowsLoaded = false;
      if (savedRowsStr) {
        try {
          const parsed = JSON.parse(savedRowsStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRows(parsed);
            rowsLoaded = true;
          }
        } catch(e) {
          console.error("Failed to parse saved session rows", e);
        }
      }
      if (!rowsLoaded) {
        setRows([{
          localId: crypto.randomUUID(),
          productId: '',
          productName: '',
          quantitySold: '',
          subtotal: '',
          synced: false
        }]);
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
    setRows([{
      localId: crypto.randomUUID(),
      productId: '',
      productName: '',
      quantitySold: '',
      subtotal: '',
      synced: false
    }]);
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

    if (!sessionId || !row.productId) return;

    if (isNaN(qty) || qty <= 0) {
      toast.error("Invalid Quantity", {
        description: "Quantity sold must be a positive number."
      });
      return;
    }
    if (isNaN(sub) || sub <= 0) {
      toast.error("Invalid Total Price", {
        description: "Total price must be a positive number."
      });
      return;
    }
    
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
      // Check if there are pending insert or edit tasks for this item in the offline queue
      const pendingTasks = await db.offlineQueue
        .filter(item => item.type === 'sale_item' && (item.payload?.local_row_id === localId || (row.dbId ? item.payload?.local_row_id === row.dbId : false)))
        .toArray();

      for (const task of pendingTasks) {
        if (task.id) await db.offlineQueue.delete(task.id);
      }

      if (row.dbId) {
        // If already synced to cloud, queue a soft-deletion task in the cloud
        await db.offlineQueue.add({
          store_id: storeId,
          type: 'sale_item_delete',
          payload: { local_row_id: row.dbId },
          created_at: Date.now(),
          status: 'pending'
        });
      }

      // Locally restore Dexie cache instantly
      const p = await db.products.get(row.productId);
      if (p) {
         await db.products.update(p.id, { quantity: p.quantity + qty });
      }
    }

    setRows(prev => prev.filter(r => r.localId !== localId));

    // If the row was already synced to Supabase (had a dbId), reconcile
    // state with server truth to prevent ghost rows or stale data.
    if (row.synced && row.dbId) {
      refreshSession();
    }
  };

  const uncommitRow = async (localId: string) => {
    const row = rows.find(r => r.localId === localId);
    const qty = row ? parseFloat(row.quantitySold.toString()) : NaN;
    if (!row || !row.synced || !row.productId || isNaN(qty)) return;

    // Remove the sale item or edit from the queue safely if it matches our localId or dbId
    const pendingTasks = await db.offlineQueue
      .filter(item => item.type === 'sale_item' && (item.payload?.local_row_id === localId || (row.dbId ? item.payload?.local_row_id === row.dbId : false)))
      .toArray();

    for (const task of pendingTasks) {
      if (task.id) await db.offlineQueue.delete(task.id);
    }

    // Refund the stock locally
    const p = await db.products.get(row.productId);
    if (p) {
        await db.products.update(p.id, { quantity: p.quantity + qty });
    }

    // Queue a deletion in the cloud (in case it already synced)
    if (row.dbId) {
      await db.offlineQueue.add({
        store_id: storeId,
        type: 'sale_item_delete',
        payload: { local_row_id: row.dbId },
        created_at: Date.now(),
        status: 'pending'
      });
    }

    setRows(prev => prev.map(r => r.localId === localId ? { ...r, synced: false, dbId: undefined } : r));
  };

  const editLocalRow = async (localId: string, productId: string, qty: number, subtotal: number) => {
    const row = rows.find(r => r.localId === localId);
    if (!row) return;

    const oldQty = parseFloat(row.quantitySold.toString());
    const oldPid = row.productId;

    // 1. Calculate available stock for the new product, taking into account old item refund if they are the same product!
    const newProd = await db.products.get(productId);
    if (!newProd) {
      throw new Error("Product not found in local cache.");
    }

    let availableStock = newProd.quantity;
    if (productId === oldPid) {
      availableStock += oldQty;
    }

    if (availableStock < qty) {
      throw new Error(`Insufficient stock for ${newProd.name || 'this product'}. Available: ${availableStock.toFixed(2)}`);
    }

    // 2. Perform the stock adjustments
    // Refund old
    if (oldPid && !isNaN(oldQty)) {
      const oldProd = await db.products.get(oldPid);
      if (oldProd) {
        await db.products.update(oldPid, { quantity: oldProd.quantity + oldQty });
      }
    }
    // Deduct new
    const updatedNewProd = await db.products.get(productId);
    if (updatedNewProd) {
      await db.products.update(productId, { quantity: updatedNewProd.quantity - qty });
    }

    // 3. Update offline queue payload (check both localId and dbId)
    const queueItem = await db.offlineQueue
      .filter(item => item.type === 'sale_item' && (item.payload?.local_row_id === localId || (row.dbId ? item.payload?.local_row_id === row.dbId : false)))
      .first();

    if (queueItem && queueItem.id) {
      await db.offlineQueue.update(queueItem.id, {
        payload: {
          ...queueItem.payload,
          product_id: productId,
          quantity: qty,
          subtotal: subtotal,
          unit_price: newProd.selling_price || 0,
          unit_cost: newProd.cost_price || 0
        }
      });
    } else {
      // It is already synced. Queue an update task in the offline queue!
      await db.offlineQueue.add({
        store_id: storeId,
        type: 'sale_item',
        payload: {
          session_id: sessionId,
          product_id: productId,
          quantity: qty,
          subtotal: subtotal,
          unit_price: newProd.selling_price || 0,
          unit_cost: newProd.cost_price || 0,
          local_row_id: row.dbId || localId
        },
        created_at: Date.now(),
        status: 'pending'
      });
    }

    // 4. Update local state
    setRows(prev => prev.map(r => r.localId === localId ? {
      ...r,
      productId,
      productName: newProd.name || 'Unknown',
      quantitySold: qty,
      subtotal: subtotal
    } : r));
  };

  const endSession = async () => {
    if (!sessionId) return;
    setIsEnding(true);

    const hasCommittedSales = rows.some(r => r.synced);

    if (!hasCommittedSales) {
      // Find the start session queue item
      const startSessionItem = await db.offlineQueue
        .filter(item => item.type === 'sale_session' && item.payload?.id === sessionId && item.payload?.action !== 'close')
        .first();

      if (startSessionItem && startSessionItem.id && startSessionItem.status === 'pending') {
        // Delete the start session action from the queue
        await db.offlineQueue.delete(startSessionItem.id);
        
        // Also clean up any stray sale_item or sale_item_delete tasks for this session from the offline queue
        await db.offlineQueue
          .filter(item => (item.type === 'sale_item' || item.type === 'sale_item_delete') && item.payload?.session_id === sessionId)
          .delete();
      } else {
        // The start session has already synced or wasn't found (started online). 
        // Queue a deletion of this session in the database.
        await db.offlineQueue.add({
          store_id: storeId,
          type: 'sale_session_delete',
          payload: { id: sessionId },
          created_at: Date.now(),
          status: 'pending'
        });
      }

      setSessionId(null);
      setIsStale(false);
      localStorage.removeItem(`session_${managerId}_${storeId}`);
      localStorage.removeItem(`session_start_${managerId}_${storeId}`);
      localStorage.removeItem(`session_rows_${managerId}_${storeId}`);
      setRows([]);
      setIsEnding(false);
      toast.info("Empty session discarded.");
      return;
    }

    // Offline-first (for sessions with active sales)
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

    // Check if the orphaned session has any active sales
    const { count, error: countError } = await supabase
      .from('sale_items')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', orphanedSession.id)
      .eq('is_deleted', false);

    const hasSales = !countError && count && count > 0;

    if (!hasSales) {
      // It is empty - delete it from database or queue deletion
      const res = await deleteSalesSession(orphanedSession.id);
      if (res.error) {
        await db.offlineQueue.add({
          store_id: storeId,
          type: 'sale_session_delete',
          payload: { id: orphanedSession.id },
          created_at: Date.now(),
          status: 'pending'
        });
      }
      setOrphanedSession(null);
      setIsRecovering(false);
      toast.info("Previous empty session discarded. You can now start a new one.");
      return;
    }
    
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
    closeOrphanedSession,
    editLocalRow
  };
}
