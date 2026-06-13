const fs = require('fs');
const path = require('path');

// Load env variables synchronously before requiring any module
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8').replace(/\r/g, '');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testPrintHistoryItems() {
  console.log('--- PRINTING INTERMEDIATE VALUES OF getManagerHistory ---');
  
  const storeId = '2d46e24a-a378-4312-a871-cc893635bf58';
  const managerId = 'b0417c76-b323-451e-98a6-623a5456918d';

  // 1. Fetch sessions
  const { data: sessions, error: sessionsErr } = await s
    .from('sales_sessions')
    .select('id, started_at, ended_at, total_revenue, status, approval_status')
    .eq('store_id', storeId)
    .eq('manager_id', managerId)
    .eq('status', 'closed')
    .order('started_at', { ascending: false })
    .limit(5);

  console.log('SESSIONS FOUND:', sessions?.length);
  const sessionIds = sessions ? sessions.map(x => x.id) : [];
  console.log('Session IDs:', sessionIds);

  // 2. Fetch sale items
  const { data: saleItems, error: itemsErr } = await s
    .from('sale_items')
    .select('id, session_id, product_id, quantity, subtotal, created_at, is_deleted, products(name)')
    .in('session_id', sessionIds)
    .limit(500);

  console.log('\nITEMS ERR:', itemsErr);
  console.log('ITEMS COUNT:', saleItems?.length);
  if (saleItems) {
    console.log('First 5 items details:');
    saleItems.slice(0, 5).forEach((item, idx) => {
      console.log(`[${idx}] Item ID: ${item.id} | Session ID: ${item.session_id} | Product Name: ${item.products?.name} | Subtotal: ${item.subtotal} | Deleted: ${item.is_deleted}`);
    });
  }

  // 3. Simulating mapping logic
  console.log('\n--- SIMULATING MAPPING ---');
  sessions.forEach(session => {
    const sessionItemsData = (saleItems || []).filter((item) => item.session_id === session.id);
    console.log(`Session ${session.id}: found ${sessionItemsData.length} items`);
  });

  console.log('--- DONE ---');
  process.exit(0);
}

testPrintHistoryItems().catch(console.error);
