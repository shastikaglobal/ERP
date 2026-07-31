const fs = require('fs');

let content = fs.readFileSync('src/pages/crm/ClientAcquisition.tsx', 'utf8');
content = content.replace(/try\s*\{\s*if\s*\(channel\)\s*\}\s*catch\s*\(err\)\s*\{\s*console\.warn\('Error removing interval',\s*err\);\s*\}/, '// Cleanup if necessary');
fs.writeFileSync('src/pages/crm/ClientAcquisition.tsx', content, 'utf8');
console.log('Fixed syntax error');
