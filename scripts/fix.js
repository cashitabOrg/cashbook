const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace ₦{...} with {formatCurrency(...)}
  content = content.replace(/₦\{([^\}]+)\}/g, (match, expr) => {
    // We want to replace .toLocaleString(undefined, { minimumFractionDigits: 2 }) or .toFixed(2)
    // Actually, simply stripping .toLocaleString(...) or .toFixed(...) is hard using a simple regex because of nested parens.
    // Instead of doing string parsing, let's just strip `.toFixed(...)` and `.toLocaleString([^)]*)` correctly.
    let clean = expr;
    clean = clean.replace(/\.toFixed\(\d+\)/g, '');
    clean = clean.replace(/\.toLocaleString\([^)]*\)/g, '');
    // Remove the trailing `})` if we accidentally matched part of `.toLocaleString(..., { ... })`
    clean = clean.replace(/, \{ minimumFractionDigits: \d+ \}\)/g, '');
    
    return `{formatCurrency(${clean})}`;
  });

  if (!content.includes('import { formatCurrency }')) {
    content = content.replace('import { useState } from "react";', 'import { useState } from "react";\nimport { formatCurrency } from "@/lib/format";');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
}

fixFile('c:\\Users\\USER\\Cashitab\\cashbook\\components\\admin\\InventoryValuation.tsx');
