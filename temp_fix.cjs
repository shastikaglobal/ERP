const fs = require('fs');
const path = 'src/pages/system/Mailbox.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('"/api/placeholder-asset"', 'window.location.origin + "/logo.webp"');
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed logo URL in Mailbox.tsx');
