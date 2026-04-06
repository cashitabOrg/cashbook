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

async function listAllTriggers() {
    console.log('--- List of All Public Triggers ---');
    const sql = "select event_object_table, trigger_name, action_timing, event_manipulation from information_schema.triggers where trigger_schema = 'public'";
    
    // Attempt via rpc 'exec_sql' 
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error('Error fetching triggers via RPC:', error.message);
        // Fallback: If RPC fails, I might need to ask the user to check their SQL editor
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

listAllTriggers();
