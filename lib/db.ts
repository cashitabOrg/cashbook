import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id: string;
  store_id: string;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_price?: number;
  selling_price?: number;
  last_synced: number;
}

export interface OfflineQueueItem {
  id?: number; // Auto-incremented local ID
  store_id: string;
  type: 'sale_session' | 'sale_item' | 'stock_decrement' | 'sale_item_delete';
  payload: any;
  created_at: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
  retry_count?: number;
}

export class FrozenPOSDatabase extends Dexie {
  products!: Table<LocalProduct, string>;
  offlineQueue!: Table<OfflineQueueItem, number>;

  constructor() {
    super('FrozenPOSDatabase');
    this.version(3).stores({
      products: 'id, store_id, name', 
      offlineQueue: '++id, store_id, status, type, created_at'
    });
  }
}

export const db = new FrozenPOSDatabase();
