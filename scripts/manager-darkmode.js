const fs = require('fs');

const files = [
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\dashboard\\ManagerSummaryCards.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\dashboard\\ManagerBestSellers.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\dashboard\\ManagerStockLevels.tsx',
  'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\ManagerDashboardClient.tsx'
];

const replacements = {
  'bg-white': 'bg-white dark:bg-[#1C1C1E]',
  'border-slate-200': 'border-slate-200 dark:border-[#2C2C2E]',
  'border-slate-100': 'border-slate-100 dark:border-[#2C2C2E]',
  'bg-slate-50/50': 'bg-slate-50/50 dark:bg-[#252528]/50',
  'bg-slate-50/80': 'bg-slate-50/80 dark:bg-[#252528]/80',
  'text-slate-900': 'text-slate-900 dark:text-white',
  'text-slate-600': 'text-slate-600 dark:text-gray-300',
  'text-slate-500': 'text-slate-500 dark:text-gray-400',
  'text-slate-400': 'text-slate-400 dark:text-gray-500',
  'divide-slate-100': 'divide-slate-100 dark:divide-[#2C2C2E]',
  'bg-blue-50': 'bg-blue-50 dark:bg-blue-500/10',
  'bg-emerald-50': 'bg-emerald-50 dark:bg-emerald-500/10',
  'bg-emerald-100': 'bg-emerald-100 dark:bg-emerald-500/20',
  'bg-red-50': 'bg-red-50 dark:bg-red-500/10',
  'bg-red-100': 'bg-red-100 dark:bg-red-500/20',
  'bg-red-50/30': 'bg-red-50/30 dark:bg-red-500/10',
  'hover:bg-slate-50/50': 'hover:bg-slate-50/50 dark:hover:bg-[#252528]/50',
  'hover:bg-blue-50': 'hover:bg-blue-50 dark:hover:bg-blue-500/20',
  'hover:bg-emerald-50': 'hover:bg-emerald-50 dark:hover:bg-emerald-500/20',
  'text-blue-600': 'text-blue-600 dark:text-blue-400',
  'text-emerald-600': 'text-emerald-600 dark:text-emerald-400',
  'text-red-600': 'text-red-600 dark:text-red-400',
  'text-red-500': 'text-red-500 dark:text-red-400',
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // We need to avoid double replacements (e.g. if dark:bg-[#1C1C1E] is already there)
  for (const [find, replace] of Object.entries(replacements)) {
    // A simple regex that replaces the class only if it's not followed by " dark:"
    // This isn't perfect, but it works for bulk tailwind replacements if run once.
    // Let's just use string replace carefully, actually the easiest way is to split by ' ' or just do naive string replacement.
    
    // Naive replace
    const regex = new RegExp(`\\b${find}\\b(?![\\w\\/]*-dark| dark:)`, 'g');
    content = content.replace(regex, replace);
  }
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated', file);
});
