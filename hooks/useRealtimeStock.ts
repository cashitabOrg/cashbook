import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { db } from '@/lib/db';

export function useRealtimeStock(storeId: string) {
  useEffect(() => {
    if (!storeId) return;

    const supabase = createClient();
    
    const channel = supabase
      .channel(`products-realtime-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${storeId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const product = payload.new as any;
            await db.products.put({
              id: product.id,
              store_id: product.store_id,
              name: product.name,
              unit: product.unit,
              quantity: product.quantity,
              min_quantity: product.min_quantity,
              cost_price: product.cost_price ?? 0,
              selling_price: product.selling_price ?? 0,
              last_synced: Date.now()
            });
          } else if (payload.eventType === 'DELETE') {
            const product = payload.old as any;
            if (product.id) {
               await db.products.delete(product.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);
}
