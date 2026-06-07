const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const dirs = ['app', 'components'];
let files = [];
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    files = walkSync(fullPath, files);
  }
});

let modifiedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let hasChanges = false;

  // Pattern 1: ₦{...}
  const regex = /₦\{([^}]+)\}/g;
  if (regex.test(content)) {
    content = content.replace(regex, (match, expr) => {
      // Clean up existing formatting functions inside the expression
      let cleanExpr = expr.replace(/\.toLocaleString\([^)]*\)/g, '')
                          .replace(/\.toFixed\(\d+\)/g, '');
      return `{formatCurrency(${cleanExpr})}`;
    });
    hasChanges = true;
  }

  // Pattern 2: `₦${...}`
  const regex2 = /`₦\$\{([^}]+)\}`/g;
  if (regex2.test(content)) {
    content = content.replace(regex2, (match, expr) => {
      let cleanExpr = expr.replace(/\.toLocaleString\([^)]*\)/g, '')
                          .replace(/\.toFixed\(\d+\)/g, '');
      return `formatCurrency(${cleanExpr})`;
    });
    hasChanges = true;
  }
  
  if (hasChanges) {
    // Add import if not present
    if (!content.includes('formatCurrency(')) {
        // wait, we replaced it, so it DOES include formatCurrency
    }
    
    if (!content.includes('import { formatCurrency }')) {
      const importStmt = `import { formatCurrency } from "@/lib/format";\n`;
      // Insert after the last import, or at the top
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLine + 1) + importStmt + content.slice(endOfLine + 1);
      } else {
        content = importStmt + content;
      }
    }
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log('Updated:', file);
  }
});

console.log(`Updated ${modifiedFiles} files.`);
