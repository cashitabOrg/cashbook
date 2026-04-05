/**
 * audit_saturday_sales.js
 * 
 * Audits Saturday's sales for the frozenpay-foodies store.
 * Compares the SUM of individual sale_item subtotals against
 * the sales_session.total_revenue to detect discrepancies caused
 * by the revenue-not-updating bug.
 * 
 * Usage: node tmp/audit_saturday_sales.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://imlnfwxfswxbxmtfrarr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function auditSaturdaySales() {
  console.log('='.repeat(65));
  console.log('  SATURDAY SALES AUDIT — frozenpay-foodies');
  console.log('='.repeat(65));

  // 1. Get the store ID
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name')
    .eq('slug', 'frozenpay-foodies')
    .single();

  if (storeError || !store) {
    console.error('❌ Store not found:', storeError?.message);
    process.exit(1);
  }

  console.log(`\n✅ Store: ${store.name} (${store.id})`);

  // 2. Find Saturday sessions (last Saturday in Africa/Lagos timezone)
  // We check the last 14 days to catch the most recent Saturday
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
  const daysToLastSat = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  const lastSaturday = new Date(now);
  lastSaturday.setDate(now.getDate() - daysToLastSat);

  // Format as YYYY-MM-DD in Africa/Lagos
  const saturdayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(lastSaturday);

  console.log(`\n📅 Auditing Saturday: ${saturdayStr}`);

  // 3. Fetch all closed sessions for that store
  const { data: sessions, error: sessionsError } = await supabase
    .from('sales_sessions')
    .select('id, started_at, ended_at, total_revenue, status, approval_status')
    .eq('store_id', store.id)
    .eq('status', 'closed')
    .order('started_at', { ascending: true });

  if (sessionsError) {
    console.error('❌ Failed to fetch sessions:', sessionsError.message);
    process.exit(1);
  }

  // Filter to Saturday sessions by Lagos timezone
  const satSessions = sessions.filter(s => {
    const lagosDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date(s.started_at));
    return lagosDate === saturdayStr;
  });

  if (satSessions.length === 0) {
    console.log('\n⚠️  No closed sessions found for Saturday. Checking all recent sessions...\n');
    
    // Show all sessions for reference
    sessions.slice(0, 10).forEach(s => {
      const lagosDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Lagos',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date(s.started_at));
      console.log(`  Session ${s.id.slice(0, 8)}... | Date: ${lagosDate} | Revenue: ₦${Number(s.total_revenue).toFixed(2)}`);
    });
    process.exit(0);
  }

  console.log(`\n📋 Found ${satSessions.length} session(s) for Saturday\n`);

  let grandTotalSessionRevenue = 0;
  let grandTotalItemsSum = 0;
  let hasDiscrepancy = false;

  for (const session of satSessions) {
    const startTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(session.started_at));

    console.log(`\n${'─'.repeat(65)}`);
    console.log(`  Session: ${session.id}`);
    console.log(`  Started: ${startTime} | Status: ${session.status} | Approval: ${session.approval_status || 'pending'}`);
    console.log(`  Recorded Session Revenue: ₦${Number(session.total_revenue).toFixed(2)}`);

    // 4. Fetch all sale items for this session
    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('id, quantity, subtotal, unit_price, unit_cost, created_at, products(name)')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error(`  ❌ Failed to fetch items: ${itemsError.message}`);
      continue;
    }

    if (!items || items.length === 0) {
      console.log('  ⚠️  No sale items found for this session.');
      continue;
    }

    // 5. Calculate sum of item subtotals
    const itemsSum = items.reduce((acc, item) => acc + Number(item.subtotal), 0);
    const sessionRevenue = Number(session.total_revenue);
    const diff = sessionRevenue - itemsSum;

    grandTotalSessionRevenue += sessionRevenue;
    grandTotalItemsSum += itemsSum;

    console.log(`\n  ITEM BREAKDOWN:`);
    console.log(`  ${'─'.repeat(58)}`);
    console.log(`  ${'#'.padEnd(3)} ${'Product'.padEnd(22)} ${'Qty'.padStart(6)} ${'Unit ₦'.padStart(10)} ${'Subtotal ₦'.padStart(12)}`);
    console.log(`  ${'─'.repeat(58)}`);

    items.forEach((item, idx) => {
      const productName = (item.products?.name || 'Unknown').slice(0, 22).padEnd(22);
      const qty = Number(item.quantity).toFixed(2).padStart(6);
      const unitPriceStr = Number(item.unit_price || 0).toFixed(2).padStart(10);
      const subtotalStr = Number(item.subtotal).toFixed(2).padStart(12);
      console.log(`  ${String(idx + 1).padEnd(3)} ${productName} ${qty} ${unitPriceStr} ${subtotalStr}`);
    });

    console.log(`  ${'─'.repeat(58)}`);
    console.log(`  ${'Sum of Items:'.padEnd(43)} ₦${itemsSum.toFixed(2).padStart(12)}`);
    console.log(`  ${'Session total_revenue field:'.padEnd(43)} ₦${sessionRevenue.toFixed(2).padStart(12)}`);

    if (Math.abs(diff) > 0.01) {
      hasDiscrepancy = true;
      console.log(`\n  ⚠️  DISCREPANCY DETECTED: ₦${diff.toFixed(2)} (${diff > 0 ? 'session over-reported' : 'session under-reported'})`);
      console.log(`  👉 The session total_revenue needs to be corrected to: ₦${itemsSum.toFixed(2)}`);
    } else {
      console.log(`\n  ✅ MATCH — Session revenue matches sum of items.`);
    }
  }

  console.log(`\n${'='.repeat(65)}`);
  console.log(`  GRAND TOTAL SUMMARY`);
  console.log(`${'='.repeat(65)}`);
  console.log(`  Sum of ALL item subtotals:     ₦${grandTotalItemsSum.toFixed(2)}`);
  console.log(`  Sum of ALL session revenues:   ₦${grandTotalSessionRevenue.toFixed(2)}`);
  const totalDiff = grandTotalSessionRevenue - grandTotalItemsSum;
  if (Math.abs(totalDiff) > 0.01) {
    console.log(`\n  ⚠️  TOTAL DISCREPANCY: ₦${Math.abs(totalDiff).toFixed(2)}`);
    console.log(`  ℹ️  Would you like to auto-fix these session revenues? Run with --fix flag.`);

    // --fix mode
    if (process.argv.includes('--fix')) {
      console.log(`\n  🔧 AUTO-FIX MODE — Correcting session revenues...`);
      for (const session of satSessions) {
        const { data: items } = await supabase
          .from('sale_items')
          .select('subtotal')
          .eq('session_id', session.id);

        if (!items) continue;
        const correctRevenue = items.reduce((acc, i) => acc + Number(i.subtotal), 0);
        const { error: fixError } = await supabase
          .from('sales_sessions')
          .update({ total_revenue: correctRevenue })
          .eq('id', session.id);

        if (fixError) {
          console.log(`  ❌ Failed to fix session ${session.id.slice(0, 8)}: ${fixError.message}`);
        } else {
          console.log(`  ✅ Fixed session ${session.id.slice(0, 8)}... → ₦${correctRevenue.toFixed(2)}`);
        }
      }
      console.log(`\n  ✅ All corrections applied. Reload the reports to verify.`);
    }
  } else {
    console.log(`\n  ✅ All sessions are balanced. No discrepancies found.`);
  }

  console.log(`${'='.repeat(65)}\n`);
}

auditSaturdaySales().catch(console.error);
