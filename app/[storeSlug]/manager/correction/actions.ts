"use server";

import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth";

export async function wipeAndOverwriteDay(
  storeId: string, 
  managerId: string, 
  rows: any[], 
  totalRevenue: number,
  targetDateStr: string
) {
  // Ensure only authenticated staff can do this
  await requireRole(["manager", "admin", "super_admin"]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  console.log('--- EXECUTING ATOMIC SUNDAY RECOVERY ---');

  const startOfTarget = `${targetDateStr}T00:00:00Z`;
  const endOfTarget = `${targetDateStr}T23:59:59Z`;

  const { data: sessions } = await supabaseAdmin
    .from('sales_sessions')
    .select('id')
    .eq('store_id', storeId)
    .gte('started_at', startOfTarget)
    .lte('started_at', endOfTarget);

  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map(s => s.id);
    const { data: saleItems } = await supabaseAdmin
      .from('sale_items')
      .select('product_id, quantity')
      .in('session_id', sessionIds);

    if (saleItems && saleItems.length > 0) {
      // Refund inventory
      const restoreTotals: Record<string, number> = {};
      saleItems.forEach((item: any) => {
        restoreTotals[item.product_id] = (restoreTotals[item.product_id] || 0) + Number(item.quantity);
      });

      for (const pid in restoreTotals) {
        const { data: p } = await supabaseAdmin.from('products').select('quantity').eq('id', pid).single();
        if (p) {
          await supabaseAdmin.from('products').update({ quantity: Number(p.quantity) + restoreTotals[pid] }).eq('id', pid);
        }
      }
      
      // Delete old items and sessions
      await supabaseAdmin.from('sale_items').delete().in('session_id', sessionIds);
      await supabaseAdmin.from('sales_sessions').delete().in('id', sessionIds);
    }
  }

  // 2. BULK WRITE PHASE
  if (!rows || rows.length === 0) return { success: true };

  const sessionUuid = crypto.randomUUID();
  const BACKDATED_TIMESTAMP = `${targetDateStr}T12:00:00.000Z`;

  // Insert Session
  await supabaseAdmin.from('sales_sessions').insert({
    id: sessionUuid,
    store_id: storeId,
    manager_id: managerId,
    status: 'closed',
    started_at: BACKDATED_TIMESTAMP,
    ended_at: BACKDATED_TIMESTAMP,
    total_revenue: totalRevenue
  });

  // Calculate items and deduct inventory
  const itemsToInsert = [];
  const deductTotals: Record<string, number> = {};
  let currentTimestamp = new Date(BACKDATED_TIMESTAMP).getTime();

  for (const row of rows) {
    if (!row.productId) continue;
    itemsToInsert.push({
      session_id: sessionUuid,
      store_id: storeId,
      product_id: row.productId,
      quantity: row.quantitySold,
      subtotal: row.subtotal,
      created_at: new Date(currentTimestamp).toISOString()
    });
    currentTimestamp += 10; // Offset by 10ms to maintain strict order
    deductTotals[row.productId] = (deductTotals[row.productId] || 0) + Number(row.quantitySold);
  }

  // Insert new items
  if (itemsToInsert.length > 0) {
     await supabaseAdmin.from('sale_items').insert(itemsToInsert);
  }

  // Deduct inventory for new items
  for (const pid in deductTotals) {
    const { data: p } = await supabaseAdmin.from('products').select('quantity').eq('id', pid).single();
    if (p) {
      await supabaseAdmin.from('products').update({ quantity: Number(p.quantity) - deductTotals[pid] }).eq('id', pid);
    }
  }

  return { success: true };
}
