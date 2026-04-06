import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

export type SaleRow = {
  localId: string;
  dbId?: string;
  productId: string;
  productName: string;
  quantitySold: number | '';
  subtotal: number | '';
  synced: boolean;
};

// FORCE DATE TO SUNDAY APRIL 5, 2026, 12:00:00 PM WAT
const BACKDATED_TIMESTAMP = '2026-04-05T12:00:00.000Z';

export function useCorrectionSession(storeSlug: string, storeId: string, managerId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  
  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sale_items')
      .select('id, product_id, quantity, subtotal, products(name)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
      
    if (data && !error) {
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
        const draftingRows = prevRows.filter(r => !r.synced && !r.dbId);
        return [...existingRows, ...draftingRows];
      });
    }
  }, [sessionId]);

  useEffect(() => {
    const saved = localStorage.getItem(`correction_session_${managerId}_${storeId}`);
    if (saved) {
      setSessionId(saved);
      const savedRowsStr = localStorage.getItem(`correction_session_rows_${managerId}_${storeId}`);
      if (savedRowsStr) {
        try { setRows(JSON.parse(savedRowsStr)); } catch(e){}
      }
    }
  }, [managerId, storeId]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(`correction_session_rows_${managerId}_${storeId}`, JSON.stringify(rows));
    }
  }, [rows, sessionId, managerId, storeId]);

  useEffect(() => {
    if (sessionId) refreshSession();
  }, [sessionId, refreshSession]);

  const totalRevenue = rows.reduce((acc, row) => acc + (row.subtotal || 0), 0);
  const totalItems = rows.reduce((acc, row) => acc + (typeof row.quantitySold === 'number' ? row.quantitySold : 0), 0);

  const startSession = async () => {
    setIsStarting(true);
    const sessionUuid = crypto.randomUUID();
    setSessionId(sessionUuid);
    localStorage.setItem(`correction_session_${managerId}_${storeId}`, sessionUuid);

    const supabase = createClient();
    await supabase.from('sales_sessions').insert({
      id: sessionUuid,
      store_id: storeId,
      manager_id: managerId,
      status: 'open',
      started_at: BACKDATED_TIMESTAMP
    });
    
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
    setRows(prev => prev.map(row => row.localId === localId ? { ...row, [field]: value } : row));
  };

  const commitRow = async (row: SaleRow) => {
    if (!sessionId || !row.productId || typeof row.subtotal !== 'number' || typeof row.quantitySold !== 'number') return;
    if (row.synced) return; 

    // Directly push to supabase to bypass local Dexie queues
    const supabase = createClient();
    
    // First let's do a quick validation just so we don't crash the server trigger
    const { data: p } = await supabase.from('products').select('*').eq('id', row.productId).single();
    if (!p) return;

    // We assume the DB triggers will deduct stock when inserted
    const { error } = await supabase.from('sale_items').insert({
      session_id: sessionId,
      store_id: storeId,
      product_id: row.productId,
      quantity: row.quantitySold,
      subtotal: row.subtotal,
      created_at: BACKDATED_TIMESTAMP
    });

    if (error) {
      toast.error('Direct insert failed', { description: error.message });
      return;
    }

    setRows(prev => prev.map(r => r.localId === row.localId ? { ...r, synced: true } : r));
    refreshSession();
  };

  const removeRow = async (localId: string) => {
    const row = rows.find(r => r.localId === localId);
    if (!row) return;

    if (row.synced && row.dbId) {
      const supabase = createClient();
      const { error } = await supabase.from('sale_items').delete().eq('id', row.dbId);
      if (error) {
        toast.error('Deletion failed', { description: error.message });
        return;
      }
    }

    setRows(prev => prev.filter(r => r.localId !== localId));
    refreshSession();
  };

  const uncommitRow = async (localId: string) => {
    const row = rows.find(r => r.localId === localId);
    if (!row || !row.synced || !row.dbId) return;

    // Delete it from server to "uncommit"
    const supabase = createClient();
    await supabase.from('sale_items').delete().eq('id', row.dbId);
    
    setRows(prev => prev.map(r => r.localId === localId ? { ...r, synced: false, dbId: undefined } : r));
    refreshSession();
  };

  const endSession = async () => {
    if (!sessionId) return;
    setIsEnding(true);

    const supabase = createClient();
    await supabase.from('sales_sessions')
      .update({
        status: 'closed',
        ended_at: BACKDATED_TIMESTAMP,
        total_revenue: totalRevenue
      })
      .eq('id', sessionId);

    setSessionId(null);
    localStorage.removeItem(`correction_session_${managerId}_${storeId}`);
    localStorage.removeItem(`correction_session_rows_${managerId}_${storeId}`);
    setRows([]);
    setIsEnding(false);
    toast.success('Backdated session closed successfully.');
  };

  return {
    isOnline: true,
    sessionId,
    isStarting,
    isEnding,
    isStale: false,
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
    refreshSession
  };
}
