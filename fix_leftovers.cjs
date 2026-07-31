const fs = require('fs');

function replaceInFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  for (const rep of replacements) {
    content = content.replace(rep.from, rep.to);
  }
  fs.writeFileSync(path, content, 'utf8');
}

// 1. ShipmentDetail.tsx
replaceInFile('src/pages/shipments/ShipmentDetail.tsx', [
  {
    from: /const error = new Error\('Supabase removed'\);/g,
    to: `// const error = new Error('Supabase removed');`
  }
]);

// 2. EditLead.tsx
replaceInFile('src/pages/crm/EditLead.tsx', [
  {
    from: /const error = new Error\('Supabase removed'\);\s*if \(error\) throw error;/g,
    to: `const res = await fetch(\`/api/crm/leads/\${id}\`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName, website, country, industry,
          contact_name: contactName, job_title: jobTitle, email, phone,
          stage, source, interested_product: product, notes
        })
      });
      if (!res.ok) throw new Error("Failed to update lead");`
  }
]);

// 3. FarmerDetail.tsx
replaceInFile('src/pages/farmers/FarmerDetail.tsx', [
  {
    from: /queryFn: async \(\) => \{\s*const data = null; const error = new Error\('Supabase removed'\);\s*if \(error\) throw error;\s*return data;\s*\}/g,
    to: `queryFn: async () => {
      const res = await fetch(\`/api/finance/purchase_orders?farmer_id=\${id}\`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      return res.json();
    }`
  }
]);

console.log("Leftovers fixed");
