'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireRole } from '@/lib/auth'
import { revalidatePath, revalidateTag } from 'next/cache'
import { toLagosDateString } from '@/lib/date-utils'

interface ActionResponse {
  success?: boolean;
  error?: string;
}

export async function deleteSaleItem(itemId: string) {
  try {
    const userRole = await requireRole(["manager", "admin", "super_admin"]);

    // 1. Fetch the sale item to get its original quantity, product_id, session_id, and subtotal
    // Also fetch the session's approval status
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('sale_items')
      .select('id, store_id, product_id, quantity, subtotal, session_id, is_deleted')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return { error: 'Sale record not found.' };
    }

    if (item.is_deleted) {
      return { error: 'This sale item has already been deleted.' };
    }

    // Fetch the session separately since the schema is not strongly relationship typed in the query
    const { data: sessionData } = await supabaseAdmin
      .from('sales_sessions')
      .select('approval_status')
      .eq('id', item.session_id)
      .single();

    const isApproved = sessionData?.approval_status === 'approved';
    if (isApproved) {
      return { error: 'This sale has been approved by an administrator and can no longer be modified.' };
    }

    if (userRole.role !== 'super_admin' && item.store_id !== userRole.storeId) {
      return { error: 'Unauthorized permission to delete this record.' };
    }

    // 2. Stock refund is handled atomically by the DB trigger 'trg_master_sale_sync'.
    // DO NOT add any application-level stock adjustment here — the trigger is the
    // single source of truth. A duplicate app-level refund causes double-deduction.

    // 3. Deduct this item's revenue from the session total
    if (item.session_id) {
       const { data: session } = await supabaseAdmin
         .from('sales_sessions')
         .select('total_revenue')
         .eq('id', item.session_id)
         .single();
         
       if (session) {
         const { error: sessErr } = await supabaseAdmin
           .from('sales_sessions')
           .update({ total_revenue: Math.max(0, Number(session.total_revenue) - Number(item.subtotal)) })
           .eq('id', item.session_id);
         
         if (sessErr) {
           console.warn('deleteSaleItem: Failed to update session total_revenue (likely database trigger misconfiguration):', sessErr.message);
         }
       }
    }

    // 4. Soft-delete the item itself
    const { error: deleteError } = await supabaseAdmin
      .from('sale_items')
      .update({ is_deleted: true })
      .eq('id', itemId);

    if (deleteError) {
      return { error: 'Failed to mark sale item as deleted in database.' };
    }

    // 5. Invalidate sales-related pages so all dashboards reflect the change
    revalidatePath('/', 'layout');
    revalidateTag('sales', 'max');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function editSaleItem(itemId: string, newQtyRaw: number, newSubtotalRaw: number, newProductId?: string) {
  try {
    const userRole = await requireRole(["manager", "admin", "super_admin"]);
    
    // Ensure numbers
    const newQty = Number(newQtyRaw);
    const newSubtotal = Number(newSubtotalRaw);

    if (isNaN(newQty) || isNaN(newSubtotal) || newQty < 0 || newSubtotal < 0) {
       return { error: 'Invalid numeric inputs.' };
    }

    // 1. Fetch original
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('sale_items')
      .select('id, store_id, product_id, quantity, subtotal, session_id, is_deleted')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return { error: 'Sale record not found.' };
    }

    if (item.is_deleted) {
      return { error: 'Cannot edit a deleted sale item.' };
    }

    // Fetch the session properties directly to check approval
    const { data: sessionData } = await supabaseAdmin
      .from('sales_sessions')
      .select('approval_status')
      .eq('id', item.session_id)
      .single();

    const isApproved = sessionData?.approval_status === 'approved';
    if (isApproved) {
      return { error: 'This sale has been approved by an administrator and can no longer be modified.' };
    }

    if (userRole.role !== 'super_admin' && item.store_id !== userRole.storeId) {
      return { error: 'Unauthorized permission to edit this record.' };
    }

    const revDiff = newSubtotal - Number(item.subtotal);

    // Note: Stock adjustment is handled atomically by the DB trigger 'trg_master_sale_sync'.
    // DO NOT add any application-level stock diff here — trigger is the single source
    // of truth. A duplicate app-level adjustment causes double-deduction.

    // 3. Adjust session revenue by the difference
    if (revDiff !== 0 && item.session_id) {
       const { data: session } = await supabaseAdmin
         .from('sales_sessions')
         .select('total_revenue')
         .eq('id', item.session_id)
         .single();
         
       if (session) {
         const newRevenue = Math.max(0, Number(session.total_revenue) + revDiff);
         const { error: sessErr } = await supabaseAdmin
           .from('sales_sessions')
           .update({ total_revenue: newRevenue })
           .eq('id', item.session_id);
         
         if (sessErr) {
           console.warn('editSaleItem: Failed to update session total_revenue (likely database trigger misconfiguration):', sessErr.message);
         }
       }
    }

    // 4. Update the actual item
    const updatePayload: any = { quantity: newQty, subtotal: newSubtotal };
    if (newProductId && newProductId !== item.product_id) {
       // CRITICAL: Ensure the new product belongs to the SAME store to prevent cross-store leakage
       const { data: newProd, error: prodErr } = await supabaseAdmin
         .from('products')
         .select('store_id')
         .eq('id', newProductId)
         .single();
       
       if (prodErr || !newProd || newProd.store_id !== userRole.storeId) {
         return { error: 'Invalid product selection: Product does not belong to your store.' };
       }
       updatePayload.product_id = newProductId;
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('sale_items')
      .update(updatePayload)
      .eq('id', itemId);

    if (updateError) {
      return { error: 'Failed to save edits to database.' };
    }

    // 5. Invalidate sales-related pages so all dashboards reflect the change
    revalidatePath('/', 'layout');
    revalidateTag('sales', 'max');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function approveDailySales(dateStr: string, storeId: string, reason?: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const userRole = await requireRole(["admin", "super_admin"]);
    
    if (userRole.role !== 'super_admin' && storeId !== userRole.storeId) {
      return { error: 'Unauthorized permission to approve records for this store.' };
    }

    const { data: allSessions, error: fetchError } = await supabaseAdmin
      .from('sales_sessions')
      .select('id, started_at, approval_status')
      .eq('store_id', storeId)
      .eq('status', 'closed');
      
    if (fetchError || !allSessions) {
      return { error: 'Failed to fetch sessions for approval.' };
    }

    const sessionsForDate = allSessions.filter(s => {
      const sDateStr = toLagosDateString(s.started_at);
      return sDateStr === dateStr;
    });

    if (sessionsForDate.length === 0) {
      return { error: 'No closed sessions found for this date.' };
    }

    const sessionIdsToApprove = sessionsForDate
      .filter(s => s.approval_status !== 'approved')
      .map(s => s.id);

    if (sessionIdsToApprove.length === 0) {
      // All sessions for this date are already approved — return success immediately to avoid database trigger crash
      return { success: true };
    }

    const { error: updateError } = await supabaseAdmin
      .from('sales_sessions')
      .update({
        approval_status: 'approved',
        approved_by: userRole.id,
        approval_reason: reason || null
      })
      .in('id', sessionIdsToApprove);

    if (updateError) {
      if (updateError.code === '42703' || updateError.message?.includes('session_id')) {
        return { error: 'Failed to update approval: A database trigger (trg_master_sale_sync) is incorrectly configured on the sales_sessions table. Please ask your administrator to run the database trigger fix.' };
      }
      return { error: 'Failed to update approval status.' };
    }

    revalidatePath('/', 'layout');
    revalidateTag('sales', 'max');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function approveSession(sessionId: string, reason?: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const userRole = await requireRole(["admin", "super_admin"]);
    
    if (!sessionId) {
      return { error: 'Session ID is required.' };
    }

    const { data: session, error: fetchError } = await supabaseAdmin
      .from('sales_sessions')
      .select('id, store_id, approval_status')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return { error: 'Sales session not found.' };
    }

    if (userRole.role !== 'super_admin' && session.store_id !== userRole.storeId) {
      return { error: 'Unauthorized permission to approve this session.' };
    }

    // AVOID CRASH: If session is already approved, just return success!
    if (session.approval_status === 'approved') {
      return { success: true };
    }

    const { error: updateError } = await supabaseAdmin
      .from('sales_sessions')
      .update({
        approval_status: 'approved',
        approved_by: userRole.id,
        approval_reason: reason || null
      })
      .eq('id', sessionId);

    if (updateError) {
      if (updateError.code === '42703' || updateError.message?.includes('session_id')) {
        return { error: 'Failed to update session: A database trigger (trg_master_sale_sync) is incorrectly configured on the sales_sessions table. Please ask your administrator to run the database trigger fix.' };
      }
      return { error: 'Failed to update session approval status.' };
    }

    revalidatePath('/', 'layout');
    revalidateTag('sales', 'max');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function deleteSalesSession(sessionId: string): Promise<ActionResponse> {
  try {
    const userRole = await requireRole(["manager", "admin", "super_admin"]);

    if (!sessionId) {
      return { error: 'Session ID is required.' };
    }

    // 1. Fetch the session
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('sales_sessions')
      .select('id, store_id, total_revenue, approval_status')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      // If the session doesn't exist in Supabase, we are done
      return { success: true };
    }

    // Block deletion of approved sessions to avoid trigger error / data inconsistency
    if (session.approval_status === 'approved') {
      return { error: 'Cannot delete an approved sales session.' };
    }

    // 2. Security Check
    if (userRole.role !== 'super_admin' && session.store_id !== userRole.storeId) {
      return { error: 'Unauthorized permission to delete this record.' };
    }

    // 3. Verify there are no active (non-deleted) sale items in the session
    const { count, error: countError } = await supabaseAdmin
      .from('sale_items')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('is_deleted', false);

    if (countError) {
      return { error: 'Failed to check session sale items.' };
    }

    if (count && count > 0) {
      return { error: 'Cannot delete a session that has active sale items.' };
    }

    // 4. Delete associated sale items first (to clear foreign key references, including soft-deleted ones)
    const { error: itemsDeleteError } = await supabaseAdmin
      .from('sale_items')
      .delete()
      .eq('session_id', sessionId);

    if (itemsDeleteError) {
      return { error: 'Failed to clean up session sale items from database.' };
    }

    // 5. Delete the session itself
    const { error: deleteError } = await supabaseAdmin
      .from('sales_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      return { error: 'Failed to delete sales session from database.' };
    }

    revalidatePath('/', 'layout');
    revalidateTag('sales', 'max');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
