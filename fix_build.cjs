const fs = require('fs');

let content1 = fs.readFileSync('src/pages/crm/Communication.tsx', 'utf8');
content1 = content1.replace(/credentials:\s*['"]include['"]\s*,\s*credentials:\s*['"]include['"]/g, "credentials: 'include'");
fs.writeFileSync('src/pages/crm/Communication.tsx', content1, 'utf8');

let content2 = fs.readFileSync('src/pages/inventory/InventoryBatches.tsx', 'utf8');
content2 = content2.replace(/const \[batchesRes, productsRes, warehousesRes\] = await Promise\.all\(\[\n\s*const \[batchesRes, productsRes, warehousesRes\] = await Promise\.all\(\[/g, "const [batchesRes, productsRes, warehousesRes] = await Promise.all([");
fs.writeFileSync('src/pages/inventory/InventoryBatches.tsx', content2, 'utf8');

console.log('Fixed build errors');
