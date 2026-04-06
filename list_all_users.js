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

async function listAllUsers() {
    let output = '--- Public Users Table ---\n';
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        output += `Error fetching users: ${error.message}\n`;
    } else {
        users.forEach(u => {
            output += `ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Role: ${u.role}\n`;
        });
    }

    output += '\n--- Auth Users ---\n';
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        output += `Error fetching auth users: ${authError.message}\n`;
    } else {
        authUsers.users.forEach(u => {
            output += `ID: ${u.id}, Email: ${u.email}, Meta: ${JSON.stringify(u.user_metadata)}\n`;
        });
    }

    fs.writeFileSync('users_list.txt', output);
    console.log('Results written to users_list.txt');
}

listAllUsers();
