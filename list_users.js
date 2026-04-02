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

async function listUsers() {
    console.log('--- GLOBAL AUTH USER AUDIT ---');
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('FAILED!', error.message);
        return;
    }

    console.log(`Found ${data.users.length} total users in Auth side.`);
    data.users.forEach(u => {
        console.log(`EM: ${u.email} | ID: ${u.id}`);
    });
    
    console.log('\n--- PUBLIC USERS AUDIT ---');
    const { data: publicUsers } = await supabase.from('users').select('*');
    if (publicUsers) {
        console.log(`Found ${publicUsers.length} total users in Public side.`);
        publicUsers.forEach(u => {
            console.log(`EM: ${u.email} | ID: ${u.id} | Store: ${u.store_id} | Role: ${u.role}`);
        });
    }
}

listUsers();
