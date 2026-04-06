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

async function testLookup(usernameInput) {
    console.log(`Testing lookup for: "${usernameInput}"`);
    
    // Existing logic (case-sensitive)
    const { data: userProfileSync } = await supabase
        .from('users')
        .select('email')
        .eq('username', usernameInput)
        .single();
    
    console.log(`- Exact (.eq): ${userProfileSync?.email || 'NOT FOUND'}`);

    // Proposed logic (case-insensitive)
    const { data: userProfileIlike } = await supabase
        .from('users')
        .select('email')
        .ilike('username', usernameInput)
        .single();
    
    console.log(`- Case-insensitive (.ilike): ${userProfileIlike?.email || 'NOT FOUND'}`);
    console.log('---');
}

async function runTests() {
    await testLookup('taiwoadedotunm1@gmail.com'); // Exact
    await testLookup('TAIWOADEDOTUNM1@GMAIL.COM'); // Uppercase
    await testLookup('TaiwoAdedotunM1@Gmail.Com'); // Mixed Case
    await testLookup('Sammy'); // Exact
    await testLookup('sammy'); // Lowercase
    await testLookup('SAMMY'); // Uppercase
}

runTests();
