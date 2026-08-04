const fs = require('fs');
const file = 'src/pages/barcodes/ScanBarcode.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `      const { data, error } = await res.json();\n        .order("created_at", { ascending: false })\n        .limit(50);\n      if (error) throw error;`,
  `      const { data, error } = await res.json();\n      if (error) throw error;`
);

content = content.replace(
  `      const { data, error } = await res.json();\n        .single();`,
  `      const { data, error } = await res.json();`
);

fs.writeFileSync(file, content);
console.log('Fixed ScanBarcode.tsx syntax error');
