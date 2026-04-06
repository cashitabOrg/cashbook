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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function listStores() {
    console.log('--- Stores ---');
    const { data: stores, error } = await supabase
        .from('stores')
        .select('*');

    if (error) {
        console.error('Error fetching stores:', error.message);
    } else {
        stores.forEach(s => {
            console.log(`ID: ${s.id}, Slug: ${s.slug}, Name: ${s.name}`);
        });
    }
}

listStores();
