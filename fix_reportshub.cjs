const fs = require('fs');

const reportsHubPath = 'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\reports\\ReportsHub.tsx';
let reportsHubContent = fs.readFileSync(reportsHubPath, 'utf8');

reportsHubContent = reportsHubContent.replace(
  /supabase\s*\.from\(['"]export_orders['"]\)\s*\.select\(['"][^'"]*['"]\s*,\s*\{\s*count:\s*['"]exact['"]\s*,\s*head:\s*true\s*\}\)/g,
  `fetch('/api/orders', { credentials: 'include' }).then(res => res.json()).then(data => ({ count: data.length }))`
);

reportsHubContent = reportsHubContent.replace(
  /supabase\s*\.from\(['"]export_shipments['"]\)\s*\.select\(['"][^'"]*['"]\s*,\s*\{\s*count:\s*['"]exact['"]\s*,\s*head:\s*true\s*\}\)\s*\.eq\(['"]status['"]\s*,\s*['"]departed['"]\)/g,
  `fetch('/api/shipments?status=departed', { credentials: 'include' }).then(res => res.json()).then(data => ({ count: data.length }))`
);

reportsHubContent = reportsHubContent.replace(
  /supabase\s*\.from\(['"]leads['"]\)\s*\.select\(['"][^'"]*['"]\s*,\s*\{\s*count:\s*['"]exact['"]\s*,\s*head:\s*true\s*\}\)\s*\.eq\(['"]stage['"]\s*,\s*['"]won['"]\)/g,
  `fetch('/api/crm/leads?stage=won', { credentials: 'include' }).then(res => res.json()).then(data => ({ count: data.length }))`
);

reportsHubContent = reportsHubContent.replace(
  /supabase\s*\.from\(['"]products['"]\)\s*\.select\(['"][^'"]*['"]\s*,\s*\{\s*count:\s*['"]exact['"]\s*,\s*head:\s*true\s*\}\)/g,
  `fetch('/api/products', { credentials: 'include' }).then(res => res.json()).then(data => ({ count: data.length }))`
);

fs.writeFileSync(reportsHubPath, reportsHubContent, 'utf8');
console.log("ReportsHub fixed");
