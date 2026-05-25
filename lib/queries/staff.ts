/**
 * ============================================================
 * CASHBOOK — STAFF QUERIES
 * ============================================================
 * Backend-owned read queries for the staff/users domain.
 * Pages import from here — they do NOT write inline Supabase calls.
 *
 * BACKEND TEAM: Maintain all staff read logic here.
 * FRONTEND TEAM: Do not modify this file.
 * ============================================================
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { StaffMember, StaffPageData } from '@/lib/types';
import { unstable_cache } from 'next/cache';

// ─── QUERIES ─────────────────────────────────────────────────

/**
 * Fetches all managers for a store along with plan and usage data.
 * Returns everything the staff page needs in a single call.
 */
export const getStaffPageData = unstable_cache(
  async (storeId: string): Promise<StaffPageData & { error: string | null }> => {
    const [storeRes, userCountRes, staffRes] = await Promise.all([
      supabaseAdmin
        .from('stores')
        .select('plan, is_billing_exempt')
        .eq('id', storeId)
        .single(),

      supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId),

      supabaseAdmin
        .from('users')
        .select('id, full_name, username, is_active, created_at')
        .eq('store_id', storeId)
        .eq('role', 'manager')
        .order('created_at', { ascending: false }),
    ]);

    if (staffRes.error) {
      return {
        staffList: [],
        store: null,
        totalUserCount: 0,
        error: staffRes.error.message,
      };
    }

    return {
      staffList: (staffRes.data || []) as StaffMember[],
      store: storeRes.data || null,
      totalUserCount: userCountRes.count || 0,
      error: null,
    };
  },
  ['staff-page-data'],
  { revalidate: 60, tags: ['staff'] }
);

/**
 * Returns the total user count for a store.
 * Used by billing/plan limit checks.
 */
export const getStaffCount = unstable_cache(
  async (storeId: string): Promise<number> => {
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);
    if (error) console.error('[queries/staff] getStaffCount error:', error.message);
    return count || 0;
  },
  ['staff-count'],
  { revalidate: 60, tags: ['staff'] }
);
