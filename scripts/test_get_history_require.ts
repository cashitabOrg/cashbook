import * as fs from 'fs';
import * as path from 'path';
import { getManagerHistory } from '../lib/queries/sales';

// 1. Load env variables synchronously before requiring any module
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8').replace(/\r/g, '');
  envFile.split('\n').forEach((line: string) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

async function main() {
  console.log('--- TESTING getManagerHistory WITH Dynamic Require ---');
  
  const storeId = '2d46e24a-a378-4312-a871-cc893635bf58';
  const managerId = 'b0417c76-b323-451e-98a6-623a5456918d';

  const result = await getManagerHistory(storeId, managerId);

  if (result.error) {
    console.error('❌ Query returned error:', result.error);
    process.exit(1);
  }

  console.log('✅ Query succeeded!');
  console.log(`dailyGroups length: ${result.dailyGroups.length}`);
  result.dailyGroups.forEach((group: any, gIdx: number) => {
    console.log(`Group [${gIdx}] Date: ${group.dateStr} | Total Revenue: ₦${group.dailyTotalRevenue} | Total Items: ${group.dailyTotalItems}`);
    group.sessions.forEach((sess: any) => {
      console.log(`    Session ID: ${sess.id} | Status: ${sess.approvalStatus} | Revenue: ₦${sess.totalRevenue} | Items Count: ${sess.itemsCount} | Items details: ${sess.items.length} items`);
      sess.items.forEach((item: any, iIdx: number) => {
        console.log(`      [${iIdx}] ${item.productName} - Qty: ${item.qtySold}, Rev: ₦${item.revenue}, Deleted: ${item.isDeleted}`);
      });
    });
  });

  console.log('--- COMPLETE ---');
  process.exit(0);
}

main().catch((err: any) => {
  console.error(err);
  process.exit(1);
});

export {};
