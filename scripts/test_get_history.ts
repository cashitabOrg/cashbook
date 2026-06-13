import * as fs from 'fs';
import * as path from 'path';

// Load env variables BEFORE importing anything else
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8').replace(/\r/g, '');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

import { getManagerHistory } from '../lib/queries/sales';

async function testGetHistory() {
  console.log('--- TESTING getManagerHistory WITH ENV LOADED ---');
  
  const storeId = '2d46e24a-a378-4312-a871-cc893635bf58';
  const managerId = 'b0417c76-b323-451e-98a6-623a5456918d';

  const result = await getManagerHistory(storeId, managerId);

  if (result.error) {
    console.error('❌ Query returned error:', result.error);
    return;
  }

  console.log('✅ Query succeeded!');
  console.log(`dailyGroups length: ${result.dailyGroups.length}`);
  if (result.dailyGroups.length > 0) {
    console.log('First group details:');
    const firstGroup = result.dailyGroups[0];
    console.log(`  Date: ${firstGroup.dateStr}`);
    console.log(`  Daily Total Revenue: ₦${firstGroup.dailyTotalRevenue}`);
    console.log(`  Daily Total Items: ${firstGroup.dailyTotalItems}`);
    console.log(`  Sessions Count: ${firstGroup.sessions.length}`);
    for (const sess of firstGroup.sessions) {
      console.log(`    Session ID: ${sess.id} | Status: ${sess.approvalStatus} | Revenue: ₦${sess.totalRevenue} | Items: ${sess.itemsCount}`);
    }
  }

  console.log('--- TEST COMPLETE ---');
}

testGetHistory().catch(console.error);
