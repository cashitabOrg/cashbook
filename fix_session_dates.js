const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Environment Variables
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

async function moveThursdayToFriday() {
  const isApply = process.argv.includes('--apply');
  const isDryRun = !isApply;

  const targetStoreId = '2d46e24a-a378-4317-bccb-cc893635bf58'; // frozenpay-foodies
  const startOfThursday = '2026-04-02T00:00:00Z';
  const endOfThursday = '2026-04-03T00:00:00Z';

  console.log('====================================================');
  console.log('   FROZEN POS: MOVE THURSDAY -> FRIDAY              ');
  console.log('====================================================');
  console.log(`Target Store: frozenpay-foodies (${targetStoreId})`);
  if (isDryRun) {
    console.log('>>> MODE: DRY RUN (No changes will be saved)       ');
    console.log('>>> To apply changes, run: node fix_session_dates.js --apply');
  } else {
    console.log('>>> MODE: APPLY (Updating database timestamps...)  ');
  }
  console.log('====================================================\n');

  console.log(`Searching for sessions on Thursday (${startOfThursday} to ${endOfThursday} UTC)...\n`);

  const { data: sessions, error } = await supabase
    .from('sales_sessions')
    .select('id, started_at, ended_at, total_revenue')
    .eq('store_id', targetStoreId)
    .gte('started_at', startOfThursday)
    .lt('started_at', endOfThursday);

  if (error) {
    console.error('Error fetching sessions:', error.message);
    return;
  }

  if (sessions.length === 0) {
    console.log('No sessions found for this store on Thursday. Nothing to move.');
    return;
  }

  console.log(`Found ${sessions.length} sessions to shift:`);
  
  let totalItemsUpdated = 0;

  for (const s of sessions) {
    const oldStartedAt = new Date(s.started_at);
    const newStartedAt = new Date(oldStartedAt.getTime() + 24 * 60 * 60 * 1000); // +24 hours
    
    let newEndedAt = null;
    if (s.ended_at) {
        const oldEndedAt = new Date(s.ended_at);
        newEndedAt = new Date(oldEndedAt.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    console.log(`\n- Session ${s.id}:`);
    console.log(`  OLD StartedAt: ${s.started_at} (UTC)`);
    console.log(`  NEW StartedAt: ${newStartedAt.toISOString()} (UTC) -- Friday April 3rd!`);

    if (isApply) {
        // 1. Update session
        const { error: sessionError } = await supabase
            .from('sales_sessions')
            .update({ 
                started_at: newStartedAt.toISOString(),
                ended_at: newEndedAt
            })
            .eq('id', s.id);

        if (sessionError) {
            console.error(`  [FAILED] Session update: ${sessionError.message}`);
        } else {
            console.log(`  [SUCCESS] Session timestamp shifted.`);
            
            // 2. Update sale_items created_at for this session
            // (Fetching first to see if they exist)
            const { data: items } = await supabase.from('sale_items').select('id, created_at').eq('session_id', s.id);
            
            if (items && items.length > 0) {
                for (const item of items) {
                    const oldCreated = new Date(item.created_at);
                    const newCreated = new Date(oldCreated.getTime() + 24 * 60 * 60 * 1000).toISOString();
                    
                    const { error: itemError } = await supabase
                        .from('sale_items')
                        .update({ created_at: newCreated })
                        .eq('id', item.id);
                    
                    if (!itemError) totalItemsUpdated++;
                }
                console.log(`  [SUCCESS] Shifted ${items.length} sale items for this session.`);
            }
        }
    }
    console.log('----------------------------------------------------');
  }

  if (isDryRun) {
    console.log('\nDry run complete. No changes made to the database.');
  } else {
    console.log(`\nScan and correction complete. Total sale items shifted: ${totalItemsUpdated}`);
  }
}

moveThursdayToFriday();
