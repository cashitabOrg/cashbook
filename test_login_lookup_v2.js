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

async function resolveEmail(identifier) {
    const id = identifier.trim();
    console.log(`Resolving: "${id}"`);

    // 1. Try exact match
    const { data: exactMatch } = await supabase
        .from('users')
        .select('email')
        .eq('username', id)
        .single();
    
    if (exactMatch) {
        console.log(`- FOUND (Exact): ${exactMatch.email}`);
        return exactMatch.email;
    }

    // 2. Try case-insensitive (only if not found exact)
    const { data: ilikeMatches } = await supabase
        .from('users')
        .select('email')
        .ilike('username', id);
    
    if (ilikeMatches && ilikeMatches.length === 1) {
        console.log(`- FOUND (Case-Insensitive): ${ilikeMatches[0].email}`);
        return ilikeMatches[0].email;
    }

    if (ilikeMatches && ilikeMatches.length > 1) {
        console.log(`- AMBIGUOUS (${ilikeMatches.length} matches found). Falling back to raw input.`);
    } else {
        console.log(`- NOT FOUND (Username). Using raw input as email.`);
    }

    return id;
}

async function runTests() {
    await resolveEmail('taiwoadedotunm1@gmail.com'); // Exact
    await resolveEmail('TAIWOADEDOTUNM1@GMAIL.COM'); // Case-insensitive
    await resolveEmail('  Sammy  '); // Trimming + Exact
    await resolveEmail('sammy'); // Case-insensitive
    await resolveEmail('nonexistent'); // None
}

runTests();
