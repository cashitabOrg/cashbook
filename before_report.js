const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function beforeReport() {
    console.log('Generating Before-Fix Inventory Report...');
    const { data: products } = await supabase.from('products').select('id, name, quantity').order('name');
    
    let report = '--- INVENTORY STATE BEFORE RECONCILIATION ---\n';
    for (const p of products) {
        report += `${p.name.padEnd(25)} | Current Qty: ${p.quantity.toFixed(2)}\n`;
    }
    
    fs.writeFileSync('inventory_before.txt', report);
    console.log('Report saved to inventory_before.txt');
}

beforeReport();
