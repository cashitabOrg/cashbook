import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as crypto from 'crypto';

const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
const envVars: any = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const s = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL || '', envVars.SUPABASE_SERVICE_ROLE_KEY || '');
const STORE_ID = '2d46e24a-a378-4312-a871-cc893635bf58';

// Lagos WAT = UTC+1
const START_11_WAT_UTC = '2026-04-10T23:00:00.000Z';
const START_12_WAT_UTC = '2026-04-11T23:00:00.000Z';
const START_13_WAT_UTC = '2026-04-12T23:00:00.000Z';

const SESSION_11 = 'bb907847-31d9-49a3-8ac6-d31777bb25b2';
const SESSION_12 = 'a554d541-bc65-4ed3-a425-2eb529e18684';

async function main() {
  console.log('--- PRECISION RESTORATION STARTED (Aggressive Mode) ---');

  // 0. UNLOCK SESSIONS
  console.log('Unlocking approved sessions...');
  await s.from('sales_sessions').update({ approval_status: 'pending' }).in('id', [SESSION_11, SESSION_12]);

  // 1. Fetch Products for mapping
  const { data: products } = await s.from('products').select('*').eq('store_id', STORE_ID);
  const prodMapByLowerName: any = {};
  const currentStockMap: any = {};
  products?.forEach(p => {
    prodMapByLowerName[p.name.toLowerCase().trim()] = p;
    currentStockMap[p.id] = p.quantity;
  });

  // 2. Map April 11 Golden Record
  const goldenRaw = JSON.parse(fs.readFileSync('scripts/golden_record_april11.json', 'utf8'));
  const items11 = goldenRaw.map((g: any) => {
    const name = g.product.toLowerCase().trim();
    let product = prodMapByLowerName[name];
    if (!product) {
       // Manual fixes for known name mismatches
       if (name === 'croaker') product = prodMapByLowerName['croaker fish'];
       if (name === 'mullet fish') product = prodMapByLowerName['mullet fish'];
       if (name.includes('shawa')) product = prodMapByLowerName['shawa fish'];
       if (name.includes('alaran')) product = prodMapByLowerName['alaran (titus fish)'];
       if (name.includes('ponmo')) product = prodMapByLowerName['ponmo'];
       if (name.includes('express')) product = prodMapByLowerName['express'];
       if (name.includes('alaska')) product = prodMapByLowerName['alaska'];
       if (name.includes('sausage')) product = prodMapByLowerName['sausage'];
       if (name.includes('kote fish')) product = prodMapByLowerName['kote fish'];
       if (name.includes('hake fish')) product = prodMapByLowerName['hake fish'];
       if (name.includes('farm chicken')) product = prodMapByLowerName['farm chicken ']; // trailing space in DB
       if (name.includes('egg')) product = prodMapByLowerName['egg'];
       if (name.includes('obokun')) product = prodMapByLowerName['obokun'];
       if (name.includes('orobo chicken')) product = prodMapByLowerName['orobo chicken'];
       if (name.includes('panla wewe')) product = prodMapByLowerName['panla wewe'];
       if (!product && name.includes('farm chicken')) product = prodMapByLowerName['farm chicken'];
    }
    
    if (!product) {
       console.warn('COULD NOT MAP:', g.product);
       return null;
    }

    const [h, m] = g.time.split(':').map(Number);
    const date = new Date('2026-04-11T00:00:00Z');
    date.setUTCHours(h - 1, m, 0, 0);

    return {
      id: crypto.randomUUID(),
      store_id: STORE_ID,
      session_id: SESSION_11,
      product_id: product.id,
      quantity: g.qty,
      subtotal: g.revenue,
      unit_price: g.unit_price,
      unit_cost: product.cost_price || 0,
      created_at: date.toISOString()
    };
  }).filter((x: any) => x !== null);

  // 3. Keep existing items for the 12th (filtered to be clean)
  const { data: current12 } = await s.from('sale_items')
    .select('*')
    .eq('store_id', STORE_ID)
    .gte('created_at', START_12_WAT_UTC)
    .lt('created_at', START_13_WAT_UTC);
  
  // Filter out any 0-revenue items from the maintained 12th data
  const realCurrent12 = (current12 || []).filter(item => item.subtotal > 0 && item.session_id === SESSION_12);

  console.log(`Maintaining ${realCurrent12.length} real items for April 12.`);

  // 4. PURGE
  console.log('Purging all data for 11th and 12th...');
  // Delete all items across BOTH sessions AND the 11th/12th range to be sure
  await s.from('sale_items').delete().eq('store_id', STORE_ID).gte('created_at', START_11_WAT_UTC).lt('created_at', START_13_WAT_UTC);
  await s.from('sale_items').delete().in('session_id', [SESSION_11, SESSION_12]);
  await s.from('inventory_movements').delete().eq('store_id', STORE_ID).gte('created_at', START_11_WAT_UTC).lt('created_at', START_13_WAT_UTC);

  // 5. RE-INSERT
  const allItemsToInsert = [...items11, ...realCurrent12];
  allItemsToInsert.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  console.log(`Inserting ${allItemsToInsert.length} precision items...`);
  const { error: insErr } = await s.from('sale_items').upsert(allItemsToInsert);
  if (insErr) {
    console.error('FAILED TO INSERT ITEMS:', insErr.message);
    return;
  }

  // 6. LINEAR LEDGER CALCULATION (Backward from now)
  const { data: todayMove } = await s.from('inventory_movements')
    .select('*')
    .eq('store_id', STORE_ID)
    .gte('created_at', START_13_WAT_UTC)
    .order('created_at', { ascending: false });

  const cursorMap = { ...currentStockMap };
  todayMove?.forEach(m => {
    cursorMap[m.product_id] -= m.quantity_change;
  });

  const movementsToInsert: any = [];
  const reversedItems = [...allItemsToInsert].reverse();
  for (const item of reversedItems) {
    const qty_after = cursorMap[item.product_id] || 0;
    const qty_before = qty_after + item.quantity;
    
    movementsToInsert.push({
      store_id: STORE_ID,
      product_id: item.product_id,
      transaction_type: 'SALE',
      quantity_change: -item.quantity,
      quantity_before: qty_before,
      quantity_after: qty_after,
      reference_id: item.id,
      created_at: item.created_at,
      actor_id: 'd3e09099-6eac-4891-89c8-2b04698131d3'
    });
    cursorMap[item.product_id] = qty_before;
  }

  console.log(`Inserting ${movementsToInsert.length} synchronized movements...`);
  const BATCH_SIZE = 50;
  for (let i = 0; i < movementsToInsert.length; i += BATCH_SIZE) {
    await s.from('inventory_movements').insert(movementsToInsert.slice(i, i + BATCH_SIZE));
  }

  // 7. Session Totals
  const rev11 = items11.reduce((sum: number, i: any) => sum + i.subtotal, 0);
  const rev12 = realCurrent12.reduce((sum: number, i: any) => sum + i.subtotal, 0);
  await s.from('sales_sessions').update({ total_revenue: rev11, approval_status: 'approved' }).eq('id', SESSION_11);
  await s.from('sales_sessions').update({ total_revenue: rev12, approval_status: 'approved' }).eq('id', SESSION_12);

  console.log('--- RESTORATION SUCCESSFUL ---');
  console.log(`April 11 items: ${items11.length} | Revenue: ₦${rev11.toLocaleString()}`);
  console.log(`April 12 items: ${realCurrent12.length} | Revenue: ₦${rev12.toLocaleString()}`);
}

main().catch(console.error);
