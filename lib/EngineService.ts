import { db, OfflineQueueItem } from './db';
import { createClient } from './supabase';

class EngineService {
  private isSyncing = false;
  private supabase = createClient();

  async hydrateProducts(storeId: string) {
    const { data: products, error } = await this.supabase
      .from('products')
      .select('id, store_id, name, unit, quantity, min_quantity')
      .eq('store_id', storeId);

    if (error) {
      console.error('Failed to fetch products for hydration', error);
      return;
    }

    if (products) {
      const dbProducts = products.map((p: any) => ({
        ...p,
        last_synced: Date.now()
      }));
      await db.products.bulkPut(dbProducts);
    }
  }

  async processQueue() {
    // NOTE: Queue processing is handled exclusively by SyncEngine.tsx (the React component)
    // which correctly handles: session_status enum ('open'/'closed'), FK dependency ordering,
    // and session auto-reconstruction. This method is intentionally disabled to prevent
    // race conditions from two engines processing the same queue simultaneously.
    return;
  }

  start() {
    // Queue processing is handled by SyncEngine.tsx React component.
    // This method is kept for API compatibility but no longer triggers sync.
  }
}

export const engineService = new EngineService();
