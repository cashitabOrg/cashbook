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

    // 2. Fetch the product to refund its stock
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single();

    if (product) {
      await supabaseAdmin
        .from('products')
        .update({ stock_quantity: Number(product.stock_quantity) + Number(item.quantity) })
        .eq('id', item.product_id);
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

    // 2. Compute stock refund/deduction based on difference
    if (qtyDiff !== 0) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (product) {
        // If qtyDiff is positive (we sold MORE), we deduct from stock (-qtyDiff)
        // If qtyDiff is negative (we sold LESS), we refund to stock (-qtyDiff = +)
        const adjustedStock = Number(product.stock_quantity) - qtyDiff;
        await supabaseAdmin
          .from('products')
          .update({ stock_quantity: adjustedStock })
          .eq('id', item.product_id);
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
