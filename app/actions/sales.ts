'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function deleteSaleItem(itemId: string) {
  try {
    const userRole = await requireRole(["manager", "admin", "super_admin"]);

    // 1. Fetch the sale item to get its original quantity, product_id, session_id, and subtotal
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('sale_items')
      .select('id, store_id, product_id, quantity, subtotal, session_id')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return { error: 'Sale record not found.' };
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

export async function editSaleItem(itemId: string, newQtyRaw: number, newSubtotalRaw: number) {
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
    const { error: updateError } = await supabaseAdmin
      .from('sale_items')
      .update({ quantity: newQty, subtotal: newSubtotal })
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
