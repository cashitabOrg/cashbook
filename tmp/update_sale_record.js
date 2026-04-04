const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const saleItemId = '3e410509-bf4a-484c-ae3a-86dd9d501da8';
  const sessionId = 'e126c7f8-6c83-4456-b09e-73e21543ec8b';
  const newSubtotal = 7200.00;
  const oldSubtotal = 4000.00;
  const difference = newSubtotal - oldSubtotal;

  console.log(`Updating sale item ${saleItemId}...`);
  // Try to find it by subtotal first to be extremely sure we have it
  const { data: findData } = await supabase.from('sale_items').select('id, subtotal').eq('subtotal', 4000);
  const exists = findData?.some(d => d.id === saleItemId);
  if (!exists) {
    console.error(`Sale item ${saleItemId} not found by subtotal search. Current IDs with 4000:`, findData?.map(d => d.id));
    return;
  }

  const { data: saleItem, error: saleError } = await supabase
    .from('sale_items')
    .update({ subtotal: newSubtotal })
    .eq('id', saleItemId)
    .select();

  if (saleError) {
    console.error('Error updating sale item:', saleError);
    return;
  }
  console.log('Updated sale item:', JSON.stringify(saleItem));

  console.log(`Updating session ${sessionId}...`);
  // Get current revenue first
  const { data: sessionData, error: sessionFetchError } = await supabase
    .from('sales_sessions')
    .select('total_revenue')
    .eq('id', sessionId);

  if (sessionFetchError || !sessionData || sessionData.length === 0) {
    console.error('Error fetching session:', sessionFetchError || 'No session found');
    return;
  }

  const currentTotal = Number(sessionData[0].total_revenue);
  const newTotalRevenue = currentTotal + difference;

  const { data: sessionUpdate, error: sessionUpdateError } = await supabase
    .from('sales_sessions')
    .update({ total_revenue: newTotalRevenue })
    .eq('id', sessionId)
    .select();

  if (sessionUpdateError) {
    console.error('Error updating session:', sessionUpdateError);
    return;
  }
  console.log('Updated session:', JSON.stringify(sessionUpdate));
  console.log('Update complete.');
}

run().catch(console.error);
