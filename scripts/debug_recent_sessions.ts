import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function debugRecentSessions() {
  console.log('--- RECENT SESSIONS DIAGNOSTIC STARTING ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  console.log('1. Fetching last 5 sessions...');
  const { data: sessions, error: sessErr } = await supabase
    .from('sales_sessions')
    .select('id, store_id, manager_id, started_at, ended_at, total_revenue, status, approval_status')
    .order('started_at', { ascending: false })
    .limit(5);

  if (sessErr) {
    console.error('ERROR fetching sessions:', sessErr);
    return;
  }

  console.log(`Found ${sessions?.length || 0} recent sessions:`);
  for (const session of sessions || []) {
    console.log(`\nSession ID: ${session.id}`);
    console.log(`  Store ID: ${session.store_id}`);
    console.log(`  Manager ID: ${session.manager_id}`);
    console.log(`  Status: ${session.status} | Approval: ${session.approval_status}`);
    console.log(`  Started: ${session.started_at} | Ended: ${session.ended_at}`);
    console.log(`  Total Revenue in Session record: ₦${session.total_revenue}`);

    // Query sale items for this session
    const { data: items, error: itemsErr } = await supabase
      .from('sale_items')
      .select('id, product_id, quantity, subtotal, is_deleted, created_at')
      .eq('session_id', session.id);

    if (itemsErr) {
      console.error(`  ERROR fetching items for session ${session.id}:`, itemsErr);
    } else {
      console.log(`  Sale Items Count: ${items?.length || 0}`);
      for (const item of items || []) {
        console.log(`    Item ID: ${item.id} | Product ID: ${item.product_id} | Qty: ${item.quantity} | Subtotal: ₦${item.subtotal} | Deleted: ${item.is_deleted}`);
      }
    }
  }

  console.log('\n--- DIAGNOSTIC COMPLETE ---');
}

debugRecentSessions().catch(console.error);
