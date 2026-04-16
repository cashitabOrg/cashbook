const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imlnfwxfswxbxmtfrarr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentMovements() {
  const { data: movements, error } = await supabase
    .from('inventory_movements')
    .select('*, products(name)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching movements:", error.message);
    return;
  }

  console.log("LAST 10 MOVEMENTS:");
  movements.forEach(m => {
    const calcAfter = Number(m.quantity_before) + Number(m.quantity_change);
    const isValid = Math.abs(calcAfter - Number(m.quantity_after)) < 0.01;
    console.log(`[${m.products.name}] ${m.transaction_type}: ${m.quantity_before} + (${m.quantity_change}) = ${m.quantity_after} | Valid: ${isValid}`);
  });
}

checkRecentMovements();
