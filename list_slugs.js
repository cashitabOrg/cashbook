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

async function listSlugs() {
    const { data: stores, error } = await supabase
        .from('stores')
        .select('id, slug, name');

    if (error) {
        console.error('Error:', error.message);
    } else {
        stores.forEach(s => {
            console.log(`'${s.slug}' -> ${s.name} (${s.id})`);
        });
    }
}

listSlugs();
