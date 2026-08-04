const fs = require('fs');

const file = 'adms-sync/server.js';
let content = fs.readFileSync(file, 'utf8');

// Replace maxAge lines for cookies
content = content.replace(/maxAge:\s*[^,]+,\s*/g, '');
content = content.replace(/maxAge:\s*[^,\n]+/g, '');

fs.writeFileSync(file, content);
console.log('Removed maxAge from cookies in server.js');
