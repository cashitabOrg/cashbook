const fs = require('fs');
const f = 'c:\\Users\\USER\\Cashitab\\cashbook\\components\\manager\\sales\\SalesSummaryBar.tsx';
let content = fs.readFileSync(f, 'utf8');

// Re-apply dark mode to this file since git checkout wiped it
const replacements = {
  'bg-white': 'bg-white dark:bg-[#1C1C1E]',
  'border-slate-200': 'border-slate-200 dark:border-[#2C2C2E]',
  'border-slate-100': 'border-slate-100 dark:border-[#2C2C2E]',
  'text-slate-900': 'text-slate-900 dark:text-white',
  'text-slate-400': 'text-slate-400 dark:text-gray-500',
  'bg-slate-100': 'bg-slate-100 dark:bg-[#2C2C2E]',
  'bg-blue-50': 'bg-blue-50 dark:bg-blue-500/10',
  'bg-emerald-50': 'bg-emerald-50 dark:bg-emerald-500/10',
  'text-blue-600': 'text-blue-600 dark:text-blue-400',
  'text-emerald-600': 'text-emerald-600 dark:text-emerald-400',
};

for (const [find, replace] of Object.entries(replacements)) {
  const regex = new RegExp(`\\b${find}\\b(?![\\w\\/]*-dark| dark:)`, 'g');
  content = content.replace(regex, replace);
}

// Update the button color to match the primary brand color (blue-600)
content = content.replace('bg-slate-900', 'bg-blue-600');
content = content.replace('hover:bg-slate-800', 'hover:bg-blue-700');

fs.writeFileSync(f, content, 'utf8');
console.log('Fixed SalesSummaryBar');
