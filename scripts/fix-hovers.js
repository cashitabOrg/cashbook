const fs = require('fs');
const files = [
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\dashboard\\ManagerSummaryCards.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\dashboard\\ManagerBestSellers.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\dashboard\\ManagerStockLevels.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\ManagerDashboardClient.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/hover:bg-slate-50\/50 dark:bg-\\[#252528\\]\/50/g, 'hover:bg-slate-50/50 dark:hover:bg-[#252528]/50');
  content = content.replace(/hover:bg-blue-50 dark:bg-blue-500\/10/g, 'hover:bg-blue-50 dark:hover:bg-blue-500/20');
  content = content.replace(/hover:bg-emerald-50 dark:bg-emerald-500\/10/g, 'hover:bg-emerald-50 dark:hover:bg-emerald-500/20');
  fs.writeFileSync(f, content, 'utf8');
});
console.log('Fixed hovers');
