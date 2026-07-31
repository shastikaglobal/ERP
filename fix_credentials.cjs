const fs = require('fs');
let content = fs.readFileSync('src/pages/crm/Activities.tsx', 'utf8');

// The file was likely auto-migrated using a script that added `credentials: 'include'` while it already existed.
content = content.replace(/credentials:\s*['"]include['"]\s*,\s*credentials:\s*['"]include['"]/g, "credentials: 'include'");

fs.writeFileSync('src/pages/crm/Activities.tsx', content, 'utf8');
console.log('Fixed duplicate credentials in Activities.tsx');
