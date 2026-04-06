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

async function resolveEmail(identifierInput) {
    const identifier = identifierInput.trim();
    console.log(`Resolving: "${identifier}"`);

    // 1. Email-First Safety (Exact match on email column)
    const { data: emailMatch } = await supabase
        .from('users')
        .select('email')
        .eq('email', identifier)
        .single();
    
    if (emailMatch) {
        console.log(`- Step 1: Found via Email (Safety Check). Using: ${emailMatch.email}`);
        return emailMatch.email;
    }

    // 2. Exact Username Match
    const { data: exactUsername } = await supabase
        .from('users')
        .select('email')
        .eq('username', identifier)
        .single();
    
    if (exactUsername) {
        console.log(`- Step 2: Found via Exact Username. Mapping to: ${exactUsername.email}`);
        return exactUsername.email;
    }

    // 3. Case-Insensitive Username Match
    const { data: ilikeMatches } = await supabase
        .from('users')
        .select('email')
        .ilike('username', identifier);
    
    if (ilikeMatches && ilikeMatches.length === 1) {
        console.log(`- Step 3: Found via Case-Insensitive Username. Mapping to: ${ilikeMatches[0].email}`);
        return ilikeMatches[0].email;
    }

    if (ilikeMatches && ilikeMatches.length > 1) {
        console.log(`- Warning: Ambiguous lookup. Falling back to raw input.`);
    } else {
        console.log(`- Step 4: No match found. Using raw input as email.`);
    }

    return identifier;
}

async function runTests() {
    // Test Case: Existing Admin (Email exists in DB)
    await resolveEmail('taiwodeveop@gmail.com');

    // Test Case: Manager Username (Virtual mapping)
    await resolveEmail('taiwoadedotunm1@gmail.com');

    // Test Case: Case-Insensitive Manager Username
    await resolveEmail('TAIWOADEDOTUNM1@GMAIL.COM');

    // Test Case: Trimming
    await resolveEmail('   Sammy   ');

    // Test Case: Non-existent
    await resolveEmail('new_user@example.com');
}

runTests();
