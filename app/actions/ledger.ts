'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export type LedgerTransaction = {
  id: string;
  store_id: string;
  product_id: string | null;
  transaction_type: string;
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  reference_id: string | null;
  note: string | null;
  actor_id: string | null;
  created_at: string;
  product_name: string | null;
  product_unit: string | null;
  staff_name: string | null;
  // Nested shape kept for backwards compat with LedgerClient filter logic
  products: { name: string; unit: string } | null;
  users: { full_name: string } | null;
};

export type LedgerProduct = {
  id: string;
  name: string;
};

export async function fetchLedgerData(storeId: string): Promise<{
  transactions: LedgerTransaction[];
  products: LedgerProduct[];
  error: string | null;
}> {
  if (!storeId) {
    return { transactions: [], products: [], error: 'No store ID provided' };
  }

  try {
    const [movementsRes, productsRes] = await Promise.all([
      supabaseAdmin
        .from('inventory_movements')
        .select(`
          id, store_id, product_id, transaction_type,
          quantity_before, quantity_change, quantity_after,
          reference_id, note, actor_id, created_at,
          products (name, unit),
          users:actor_id (full_name)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(250),

      supabaseAdmin
        .from('products')
        .select('id, name')
        .eq('store_id', storeId)
        .eq('is_archived', false)
        .order('name', { ascending: true }),
    ]);

    if (movementsRes.error) {
      console.error('[actions/ledger] movements error:', movementsRes.error.message);
    }
    if (productsRes.error) {
      console.error('[actions/ledger] products error:', productsRes.error.message);
    }

    // Flatten to plain JSON — no Supabase internal references cross the boundary
    const transactions: LedgerTransaction[] = (movementsRes.data || []).map((row) => {
      const p = row.products as any;
      const u = row.users as any;
      return {
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
        product_name: p?.name ? String(p.name) : null,
        product_unit: p?.unit ? String(p.unit) : null,
        staff_name: u?.full_name ? String(u.full_name) : null,
        products: p ? { name: String(p.name ?? ''), unit: String(p.unit ?? '') } : null,
        users: u ? { full_name: String(u.full_name ?? '') } : null,
      };
    });

    const products: LedgerProduct[] = (productsRes.data || []).map((row) => ({
      id: String(row.id ?? ''),
      name: String(row.name ?? ''),
    }));

    return { transactions, products, error: null };
  } catch (err: any) {
    console.error('[actions/ledger] unexpected error:', err?.message ?? err);
    return { transactions: [], products: [], error: 'Failed to load ledger data' };
  }
}
