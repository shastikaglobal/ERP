const fs = require('fs');

function fixCredentials(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Remove the inline `credentials: 'include', ` that was prepended
  content = content.replace(/\{\s*credentials:\s*['"]include['"]\s*,\s*/g, "{ ");
  fs.writeFileSync(filePath, content, 'utf8');
}

fixCredentials('src/pages/crm/Activities.tsx');
fixCredentials('src/pages/crm/Communication.tsx');

let content = fs.readFileSync('src/pages/quotations/CreateQuotation.tsx', 'utf8');
content = content.replace(/\s*\} else \{\s*console\.error\('Failed to load leads', await leadsRes\.text\(\)\);\s*\}/, "");
fs.writeFileSync('src/pages/quotations/CreateQuotation.tsx', content, 'utf8');

console.log('Fixed build errors forcefully');
