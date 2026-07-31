const fs = require('fs');

let content = fs.readFileSync('src/pages/procurement/SupplierDetail.tsx', 'utf8');
content = content.replace(/const headers: any = \{ , 'Content-Type'/g, "const headers: any = { 'Content-Type'");
fs.writeFileSync('src/pages/procurement/SupplierDetail.tsx', content, 'utf8');

console.log('Fixed build error in SupplierDetail');
