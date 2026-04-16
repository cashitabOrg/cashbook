'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
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
    if (isApproved && userRole.role === 'manager') {
      return { error: 'This sale has been approved by an administrator and can no longer be modified.' };
    }

    if (userRole.role !== 'super_admin' && item.store_id !== userRole.storeId) {
      return { error: 'Unauthorized permission to delete this record.' };
    }

    // 2. Stock refund is handled atomically by the DB trigger 'trg_master_sale_sync'.
    // APPLICATION-LEVEL SAFETY NET: Also refund stock directly in case trigger is not active.
    const { data: prodForDelete } = await supabaseAdmin
      .from('products')
      .select('quantity')
      .eq('id', item.product_id)
      .single();

    if (prodForDelete) {
      await supabaseAdmin
        .from('products')
        .update({ quantity: Number(prodForDelete.quantity) + Number(item.quantity) })
        .eq('id', item.product_id);

      // Also log the void movement manually as a fallback
      await supabaseAdmin.from('inventory_movements').insert({
        store_id: item.store_id,
        product_id: item.product_id,
        transaction_type: 'SALE_VOID',
        quantity_before: Number(prodForDelete.quantity),
        quantity_change: Number(item.quantity),
        quantity_after: Number(prodForDelete.quantity) + Number(item.quantity),
        reference_id: item.id,
        note: `[APP] DELETED - Restored ${item.quantity} back to stock`,
        actor_id: userRole.id
      });
    }

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

    // 4. Soft-delete the item itself
    const { error: deleteError } = await supabaseAdmin
      .from('sale_items')
      .update({ is_deleted: true })
      .eq('id', itemId);

    if (deleteError) {
      return { error: 'Failed to mark sale item as deleted in database.' };
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
    if (isApproved && userRole.role === 'manager') {
      return { error: 'This sale has been approved by an administrator and can no longer be modified.' };
    }

    if (userRole.role !== 'super_admin' && item.store_id !== userRole.storeId) {
      return { error: 'Unauthorized permission to edit this record.' };
    }

    const qtyDiff = newQty - Number(item.quantity);
    const revDiff = newSubtotal - Number(item.subtotal);

    // 2. Resolve new product ID (needed before stock sync)
    const effectiveProductId = (newProductId && newProductId !== item.product_id) ? newProductId : item.product_id;

    // qtyDiff for stock: if new qty INCREASED, we sold more → stock goes DOWN (negative)
    // if new qty DECREASED, we sold less → stock goes UP (positive)
    const stockDiff = Number(item.quantity) - newQty; // inverse of qtyDiff: positive = refund, negative = more consumed

    // APPLICATION-LEVEL SAFETY NET: Sync stock directly (reliable regardless of DB trigger state)
    if (stockDiff !== 0) {
      const { data: prodForEdit } = await supabaseAdmin
        .from('products')
        .select('quantity')
        .eq('id', effectiveProductId)
        .single();

      if (prodForEdit) {
        const qtyBefore = Number(prodForEdit.quantity);
        await supabaseAdmin
          .from('products')
          .update({ quantity: qtyBefore + stockDiff })
          .eq('id', effectiveProductId);

        // Log the edit movement
        await supabaseAdmin.from('inventory_movements').insert({
          store_id: item.store_id,
          product_id: effectiveProductId,
          transaction_type: 'SALE_EDIT',
          quantity_before: qtyBefore,
          quantity_change: stockDiff,
          quantity_after: qtyBefore + stockDiff,
          reference_id: item.id,
          note: `[APP] EDITED - Qty changed from ${item.quantity} to ${newQty}`,
          actor_id: userRole.id
        });
      }
    }

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
      const sDateStr = toLagosDateString(s.started_at);
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
