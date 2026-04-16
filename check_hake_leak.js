const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imlnfwxfswxbxmtfrarr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHakeLeak() {
  console.log("=== CHECKING FOR HAKE LEAK ACROSS STORES ===");

  const { data: products } = await supabase
    .from('products')
    .select('id, name, store_id, stores(name, slug)')
    .ilike('name', '%Hake%');

  console.log(`Found ${products?.length || 0} products matching 'Hake':`);
  products?.forEach(p => {
    console.log(`- ID: ${p.id} | Name: ${p.name} | Store: ${p.stores.name} (${p.stores.slug})`);
  });

  console.log("\n=== RECENT MOVEMENTS FOR HAKE ===");
  const hakeIds = products?.map(p => p.id) || [];
  
  const { data: movements } = await supabase
    .from('inventory_movements')
    .select('*, products(name), stores(name)')
    .in('product_id', hakeIds)
    .order('created_at', { ascending: false })
    .limit(10);

  movements?.forEach(m => {
    console.log(`[${m.created_at}] Movement Store: ${m.store_id} (${m.stores.name}) | Product Store: ${m.products.store_id} | Product Name: ${m.products.name}`);
    if (m.store_id !== m.products.store_id) {
       console.log(`💥 LEAK DETECTED! Product belongs to ${m.products.store_id} but movement recorded in ${m.store_id}`);
    }
  });
}

checkHakeLeak();
