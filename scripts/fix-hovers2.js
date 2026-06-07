const fs = require('fs');
const files = [
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\dashboard\\ManagerSummaryCards.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\dashboard\\ManagerBestSellers.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\dashboard\\ManagerStockLevels.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\ManagerDashboardClient.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/bg-red-50 dark:bg-red-500\/10\/30/g, 'bg-red-50/30 dark:bg-red-500/10');
  content = content.replace(/hover:bg-slate-50\/50 dark:bg-\\[#252528\\]\/50/g, 'hover:bg-slate-50/50 dark:hover:bg-[#252528]/50');
  content = content.replace(/hover:bg-blue-50 dark:bg-blue-500\/10/g, 'hover:bg-blue-50 dark:hover:bg-blue-500/20');
  content = content.replace(/hover:bg-emerald-50 dark:bg-emerald-500\/10/g, 'hover:bg-emerald-50 dark:hover:bg-emerald-500/20');
  content = content.replace(/bg-emerald-100 dark:bg-emerald-500\/20/g, 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400');
  fs.writeFileSync(f, content, 'utf8');
});
console.log('Fixed hovers and bg-red');
