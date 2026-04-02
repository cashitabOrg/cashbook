const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking sale_items table structure...");
  // We can't query pg_attribute directly via supabase-js unless we have an RPC.
  // Let's try to query one row and see what the keys are.
  const { data, error } = await supabase.from('sale_items').select('*').limit(1);
  
  if (error) {
     console.error("Fetch Error:", error.message);
     fs.writeFileSync('db_check.txt', "Fetch Error: " + error.message);
     return;
  }

  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log("Actual Columns in sale_items:", columns);
    fs.writeFileSync('db_check.txt', "Columns: " + columns.join(", "));
  } else {
    console.log("No data in sale_items. Trying products table...");
    const { data: pData } = await supabase.from('products').select('*').limit(1);
    if (pData && pData.length > 0) {
       console.log("Products Columns:", Object.keys(pData[0]));
    }
  }
  if (error) {
     console.error("Profile Fetch Error:", error.message);
     fs.writeFileSync('db_check.txt', "Profile Fetch Error: " + JSON.stringify(error));
     return;
  }

  let output = "=== USER PROFILES ===\n";
  users.forEach(u => {
      output += `Email: ${u.email}\n`;
      output += `  Role: ${u.role}\n`;
      output += `  StoreID: ${u.store_id}\n`;
      output += `  ID: ${u.id}\n`;
      output += '-------------------\n';
  });
  fs.writeFileSync('db_check.txt', output);
  console.log("Check complete, see db_check.txt");
}

check();
