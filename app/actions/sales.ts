'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

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
      .select('id, store_id, product_id, quantity, subtotal, session_id')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return { error: 'Sale record not found.' };
    }

    // Fetch the session separately since the schema is not strongly relationship typed in the query
    const { data: sessionData } = await supabaseAdmin
      .from('sales_sessions')
      .select('approval_status')
      .eq('id', item.session_id)
      .single();

    const isApproved = sessionData?.approval_status === 'approved';
    if (isApproved && userRole.role === 'manager') {
      return { error: 'This sale has been approved by an administrator and can no longer be modified.' };
    }

    if (userRole.role !== 'super_admin' && item.store_id !== userRole.storeId) {
      return { error: 'Unauthorized permission to delete this record.' };
    }

    // 2. The stock refund is now handled automatically by the Database Trigger 'trg_sync_stock_on_sale_change' 
    // whenever a sale_item is deleted.

    // 3. Fetch the session to deduct its revenue
    if (item.session_id) {
       const { data: session } = await supabaseAdmin
         .from('sales_sessions')
         .select('total_revenue')
         .eq('id', item.session_id)
         .single();
         
       if (session) {
         await supabaseAdmin
           .from('sales_sessions')
           .update({ total_revenue: Math.max(0, Number(session.total_revenue) - Number(item.subtotal)) })
           .eq('id', item.session_id);
       }
    }

    // 4. Delete the item itself
    const { error: deleteError } = await supabaseAdmin
      .from('sale_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      return { error: 'Failed to delete sale item from database.' };
    }

    // 5. Invalidate the entire routing cache so all dashboards reflect the stock return and revenue drop
    revalidatePath('/', 'layout');

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
      .select('id, store_id, product_id, quantity, subtotal, session_id')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return { error: 'Sale record not found.' };
    }

    // Fetch the session properties directly to check approval
    const { data: sessionData } = await supabaseAdmin
      .from('sales_sessions')
      .select('approval_status')
      .eq('id', item.session_id)
      .single();

    const isApproved = sessionData?.approval_status === 'approved';
    if (isApproved && userRole.role === 'manager') {
      return { error: 'This sale has been approved by an administrator and can no longer be modified.' };
    }

    if (userRole.role !== 'super_admin' && item.store_id !== userRole.storeId) {
      return { error: 'Unauthorized permission to edit this record.' };
    }

    const qtyDiff = newQty - Number(item.quantity);
    const revDiff = newSubtotal - Number(item.subtotal);

    // 2. The stock adjustment is now handled automatically by the Database Trigger 'trg_sync_stock_on_sale_change'
    // whenever a sale_item is updated.

    // 3. Compute session revenue adjustment
    if (revDiff !== 0 && item.session_id) {
       const { data: session } = await supabaseAdmin
         .from('sales_sessions')
         .select('total_revenue')
         .eq('id', item.session_id)
         .single();
         
       if (session) {
         const newRevenue = Math.max(0, Number(session.total_revenue) + revDiff);
         await supabaseAdmin
           .from('sales_sessions')
           .update({ total_revenue: newRevenue })
           .eq('id', item.session_id);
       }
    }

    // 4. Update the actual item
    const updatePayload: any = { quantity: newQty, subtotal: newSubtotal };
    if (newProductId && newProductId !== item.product_id) {
       updatePayload.product_id = newProductId;
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('sale_items')
      .update(updatePayload)
      .eq('id', itemId);

    if (updateError) {
      return { error: 'Failed to save edits to database.' };
    }

    // 5. Invalidate the entire routing cache
    revalidatePath('/', 'layout');

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
      .select('id, started_at')
      .eq('store_id', storeId)
      .eq('status', 'closed');
      
    if (fetchError || !allSessions) {
      return { error: 'Failed to fetch sessions for approval.' };
    }

    const sessionIdsToApprove = allSessions.filter(s => {
      const sDateStr = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Africa/Lagos', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).format(new Date(s.started_at));
      return sDateStr === dateStr;
    }).map(s => s.id);

    if (sessionIdsToApprove.length === 0) {
      return { error: 'No closed sessions found for this date.' };
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
      return { error: 'Failed to update approval status.' };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
