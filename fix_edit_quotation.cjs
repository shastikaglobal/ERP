const fs = require('fs');

let content = fs.readFileSync('src/pages/quotations/EditQuotation.tsx', 'utf8');

content = content.replace(/if \(!custErr && custData\) customerId = custData\.id;\s*\}/, `if (existingCust) { customerId = existingCust.id; }`);

fs.writeFileSync('src/pages/quotations/EditQuotation.tsx', content, 'utf8');

console.log('Fixed EditQuotation.tsx syntax error');
