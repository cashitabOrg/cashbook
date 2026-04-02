import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export type SaleRow = {
  localId: string; // for UI iteration
  dbId?: string; // assigned when synced
  productId: string;
  productName: string;
  quantitySold: number | '';
  subtotal: number | '';
  synced: boolean;
};

export function useSalesSession(storeSlug: string, storeId: string, managerId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // 1. Fetching logic refactored for re-use
  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sale_items')
      .select('id, product_id, quantity, subtotal, products(name)')
      .eq('session_id', sessionId);
      
    if (data && !error) {
      const existingRows: SaleRow[] = data.map((item: any) => ({
        localId: crypto.randomUUID(),
        dbId: item.id,
        productId: item.product_id,
        productName: item.products?.name || 'Unknown',
        quantitySold: Number(item.quantity),
        subtotal: Number(item.subtotal),
        synced: true
      }));
      setRows(existingRows);
    }
  }, [sessionId]);

  // Initial hydration: Check for active session in localStorage & fetch items
  useEffect(() => {
    const savedSessionId = localStorage.getItem(`session_${managerId}_${storeId}`);
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
  }, [managerId, storeId]);

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

  const totalRevenue = rows.reduce((acc, row) => acc + (row.subtotal || 0), 0);
  const totalItems = rows.reduce((acc, row) => acc + (typeof row.quantitySold === 'number' ? row.quantitySold : 0), 0);

  const startSession = async () => {
    setIsStarting(true);
    // Offline-first: generate UUID and queue
    const sessionUuid = crypto.randomUUID();
    setSessionId(sessionUuid);
    localStorage.setItem(`session_${managerId}_${storeId}`, sessionUuid);

    await db.offlineQueue.add({
      store_id: storeId,
      type: 'sale_session',
      payload: { id: sessionUuid, manager_id: managerId, started_at: new Date().toISOString() },
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
    if (!sessionId || !row.productId || typeof row.subtotal !== 'number' || typeof row.quantitySold !== 'number') return;
    
    if (row.synced) return; // already committed

    // 1. Validation: Check available stock in Dexie Before Committing
    const p = await db.products.get(row.productId);
    if (!p || p.quantity < row.quantitySold) {
       toast.error(`Insufficient stock for ${row.productName || 'this product'}`, {
         description: `Available: ${p?.quantity?.toFixed(2) || '0.00'} | Requested: ${row.quantitySold.toFixed(2)}`
       });
       return;
    }
    
    const payload = {
      store_id: storeId,
      session_id: sessionId,
      product_id: row.productId,
      quantity: row.quantitySold,
      subtotal: row.subtotal,
    };

    // Offline-first: Always queue offline
    await db.offlineQueue.add({
      store_id: storeId,
      type: 'sale_item',
      payload: { ...payload, local_row_id: row.localId },
      created_at: Date.now(),
      status: 'pending'
    });
    
    // Also queue the decrement globally
    await db.offlineQueue.add({
      store_id: storeId,
      type: 'stock_decrement',
      payload: { product_id: row.productId, quantity: row.quantitySold },
      created_at: Date.now(),
      status: 'pending'
    });
    
    // Locally adjust Dexie cache instantly for realtime UI feedback
    if (p) {
       await db.products.update(p.id, { quantity: p.quantity - row.quantitySold });
    }

    setRows(prev => prev.map(r => r.localId === row.localId ? { ...r, synced: true } : r));
  };

  const removeRow = async (localId: string) => {
    const row = rows.find(r => r.localId === localId);
    if (!row) return;

    if (row.synced && row.productId && typeof row.quantitySold === 'number') {
      // Offline-first refund: Queue a negative decrement (which adds stock back globally)
      await db.offlineQueue.add({
        store_id: storeId,
        type: 'stock_decrement',
        payload: { product_id: row.productId, quantity: -row.quantitySold },
        created_at: Date.now(),
        status: 'pending'
      });
      
      // We don't have the server ID of the sale_item to delete it directly in offline mode.
      // A robust system queues a "delete_sale_item_by_local_id" command. For now we just refund stock.
      
      // Locally restore Dexie cache instantly
      const p = await db.products.get(row.productId);
      if (p) {
         await db.products.update(p.id, { quantity: p.quantity + row.quantitySold });
      }
    }

    setRows(prev => prev.filter(r => r.localId !== localId));
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
    localStorage.removeItem(`session_${managerId}_${storeId}`);
    setRows([]);
    setIsEnding(false);
  };

  return {
    isOnline,
    sessionId,
    isStarting,
    isEnding,
    rows,
    totalRevenue,
    totalItems,
    startSession,
    addEmptyRow,
    updateRow,
    commitRow,
    removeRow,
    endSession,
    refreshSession
  };
}
