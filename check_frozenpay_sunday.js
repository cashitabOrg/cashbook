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

async function checkSundaySessions() {
    // Sunday, April 5th, 2026
    const sundayStart = '2026-04-05T00:00:00Z';
    const sundayEnd = '2026-04-05T23:59:59Z';
    
    let result = `Checking sessions for Sunday (2026-04-05)...\n\n`;

    // 1. Check by email search (matching 'frozenpayfoodies')
    const { data: users } = await supabase
        .from('users')
        .select('id, email, username, full_name')
        .or('email.ilike.%frozenpayfoodies%,username.ilike.%frozenpayfoodies%');

    if (users && users.length > 0) {
        for (const user of users) {
            const { count, error } = await supabase
                .from('sales_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('manager_id', user.id)
                .gte('started_at', sundayStart)
                .lte('started_at', sundayEnd);
            
            result += `User: ${user.full_name} (${user.email}) - Sessions: ${count || 0}\n`;
        }
    } else {
        result += 'No users found matching "frozenpayfoodies"\n';
    }

    // 2. Check by store slug search
    const { data: stores } = await supabase
        .from('stores')
        .select('id, slug, name')
        .ilike('slug', '%frozenpay%');

    if (stores && stores.length > 0) {
        for (const store of stores) {
            const { count, error } = await supabase
                .from('sales_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('store_id', store.id)
                .gte('started_at', sundayStart)
                .lte('started_at', sundayEnd);
            
            result += `Store: ${store.name} (${store.slug}) - Total Sessions: ${count || 0}\n`;
        }
    } else {
        result += 'No stores found matching "frozenpay"\n';
    }

    fs.writeFileSync('sunday_sessions_report.txt', result);
    console.log('Results written to sunday_sessions_report.txt');
}

checkSundaySessions();
