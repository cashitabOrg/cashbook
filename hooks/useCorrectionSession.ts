import { useState, useEffect } from 'react';

export type SaleRow = {
  localId: string;
  productId: string;
  productName: string;
  quantitySold: number | '';
  subtotal: number | '';
};

export function useCorrectionSession(storeSlug: string, storeId: string, managerId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  
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

  const totalRevenue = rows.reduce((acc, row) => acc + (Number(row.subtotal) || 0), 0);
  const totalItems = rows.reduce((acc, row) => acc + (typeof row.quantitySold === 'number' ? row.quantitySold : 0), 0);

  const startSession = async () => {
    setIsStarting(true);
    const sessionUuid = crypto.randomUUID();
    setSessionId(sessionUuid);
    localStorage.setItem(`correction_session_${managerId}_${storeId}`, sessionUuid);
    setRows([]);
    setIsStarting(false);
  };

  const addEmptyRow = () => {
    setRows(prev => [...prev, {
      localId: crypto.randomUUID(),
      productId: '',
      productName: '',
      quantitySold: '',
      subtotal: ''
    }]);
  };

  const updateRow = (localId: string, field: keyof SaleRow, value: any) => {
    setRows(prev => prev.map(row => row.localId === localId ? { ...row, [field]: value } : row));
  };

  const removeRow = (localId: string) => {
    setRows(prev => prev.filter(r => r.localId !== localId));
  };

  const clearSessionLocal = () => {
    setSessionId(null);
    localStorage.removeItem(`correction_session_${managerId}_${storeId}`);
    localStorage.removeItem(`correction_session_rows_${managerId}_${storeId}`);
    setRows([]);
  };

  return {
    sessionId,
    isStarting,
    rows,
    totalRevenue,
    totalItems,
    startSession,
    addEmptyRow,
    updateRow,
    removeRow,
    clearSessionLocal
  };
}
