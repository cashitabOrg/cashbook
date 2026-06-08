const fs = require('fs');
const files = [
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\sales\\SalesEntryTable.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\sales\\SalesSessionState.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\sales\\SalesSummaryBar.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\sales\\SalesTopBanner.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\history\\HistoryPerformance.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\history\\HistoryRowHeader.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\history\\HistoryTransactionLog.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\ManagerHistoryRow.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\ManagerHistoryClient.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\app\\[storeSlug]\\manager\\history\\page.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\app\\[storeSlug]\\manager\\sales\\page.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) {
    console.log('Skipping missing file', f);
    return;
  }
  let content = fs.readFileSync(f, 'utf8');

  // Generic tailwind dark mode maps
  const replacements = {
    'bg-white': 'bg-white dark:bg-[#1C1C1E]',
    'border-slate-200': 'border-slate-200 dark:border-[#2C2C2E]',
    'border-slate-100': 'border-slate-100 dark:border-[#2C2C2E]',
    'bg-slate-50/50': 'bg-slate-50/50 dark:bg-[#252528]/50',
    'bg-slate-50/80': 'bg-slate-50/80 dark:bg-[#252528]/80',
    'bg-slate-50': 'bg-slate-50 dark:bg-[#252528]',
    'bg-slate-100': 'bg-slate-100 dark:bg-[#2C2C2E]',
    'text-slate-900': 'text-slate-900 dark:text-white',
    'text-slate-800': 'text-slate-800 dark:text-gray-200',
    'text-slate-600': 'text-slate-600 dark:text-gray-300',
    'text-slate-500': 'text-slate-500 dark:text-gray-400',
    'text-slate-400': 'text-slate-400 dark:text-gray-500',
    'divide-slate-100': 'divide-slate-100 dark:divide-[#2C2C2E]',
    'bg-blue-50': 'bg-blue-50 dark:bg-blue-500/10',
    'bg-emerald-50': 'bg-emerald-50 dark:bg-emerald-500/10',
    'bg-emerald-100': 'bg-emerald-100 dark:bg-emerald-500/20',
    'bg-red-50': 'bg-red-50 dark:bg-red-500/10',
    'bg-red-100': 'bg-red-100 dark:bg-red-500/20',
    'bg-amber-50': 'bg-amber-50 dark:bg-amber-500/10',
    'text-blue-600': 'text-blue-600 dark:text-blue-400',
    'text-emerald-600': 'text-emerald-600 dark:text-emerald-400',
    'text-emerald-700': 'text-emerald-700 dark:text-emerald-400',
    'text-red-600': 'text-red-600 dark:text-red-400',
    'text-amber-600': 'text-amber-600 dark:text-amber-400',
    'ring-slate-100': 'ring-slate-100 dark:ring-[#2C2C2E]',
    'placeholder:text-slate-400': 'placeholder:text-slate-400 dark:placeholder:text-gray-500'
  };

  for (const [find, replace] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${find}\\b(?![\\w\\/]*-dark| dark:)`, 'g');
    content = content.replace(regex, replace);
  }

  // hover states fix
  content = content.replace(/hover:bg-slate-50\/50 dark:bg-\\[#252528\\]\/50/g, 'hover:bg-slate-50/50 dark:hover:bg-[#252528]/50');
  content = content.replace(/hover:bg-slate-50 dark:bg-\\[#252528\\]/g, 'hover:bg-slate-50 dark:hover:bg-[#252528]');
  content = content.replace(/hover:bg-slate-100 dark:bg-\\[#2C2C2E\\]/g, 'hover:bg-slate-100 dark:hover:bg-[#2C2C2E]');
  content = content.replace(/hover:bg-blue-50 dark:bg-blue-500\/10/g, 'hover:bg-blue-50 dark:hover:bg-blue-500/20');
  content = content.replace(/hover:bg-emerald-50 dark:bg-emerald-500\/10/g, 'hover:bg-emerald-50 dark:hover:bg-emerald-500/20');
  content = content.replace(/hover:bg-red-50 dark:bg-red-500\/10/g, 'hover:bg-red-50 dark:hover:bg-red-500/20');
  content = content.replace(/hover:text-slate-900 dark:text-white/g, 'hover:text-slate-900 dark:hover:text-white');
  content = content.replace(/hover:text-blue-600 dark:text-blue-400/g, 'hover:text-blue-600 dark:hover:text-blue-400');
  content = content.replace(/hover:text-red-600 dark:text-red-400/g, 'hover:text-red-600 dark:hover:text-red-400');

  // specific margin for history accordion container
  if (f.endsWith('ManagerHistoryRow.tsx')) {
    content = content.replace(
      'className="bg-white dark:bg-[#1C1C1E] lg:rounded-xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E] overflow-hidden transition-all duration-200"',
      'className="bg-white dark:bg-[#1C1C1E] lg:rounded-xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E] overflow-hidden transition-all duration-200 mx-4 lg:mx-8 mb-4"'
    );
    // Also, if it hasn't been transformed yet, try the original:
    content = content.replace(
      'className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 overflow-hidden transition-all duration-200"',
      'className="bg-white dark:bg-[#1C1C1E] lg:rounded-xl lg:shadow-sm lg:border border-slate-200 dark:border-[#2C2C2E] overflow-hidden transition-all duration-200 mx-4 lg:mx-8 mb-4"'
    );
  }

  // fix ManagerHistoryClient padding to account for margins
  if (f.endsWith('ManagerHistoryClient.tsx')) {
    content = content.replace(
      'className="space-y-4"',
      'className="space-y-2"' // we use mb-4 on children now, so we can reduce space-y-4 or leave it. Let's just remove space-y-4 if present and handle gap.
    );
  }

  fs.writeFileSync(f, content, 'utf8');
});
console.log('Processed sales and history components.');
