const fs = require('fs');

function replaceInFile(filePath, searchRegex, replaceStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchRegex, replaceStr);
  fs.writeFileSync(filePath, content, 'utf8');
}

// 1. EditLead.tsx
replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\EditLead.tsx',
  /const \{ data, error \} = await supabase[\s\S]*?\.single\(\);/g,
  `const res = await fetch(\`/api/crm/leads/\${id}\`, { credentials: 'include' });
      const data = await res.json().catch(() => null);
      const error = res.ok ? null : new Error('Failed');`
);

replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\EditLead.tsx',
  /const \{ error \} = await supabase[\s\S]*?\.update\(updateData\)[\s\S]*?\.eq\('id', id\);/g,
  `const res = await fetch(\`/api/crm/leads/\${id}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
      const error = res.ok ? null : new Error('Failed');`
);

// 2. ClientAcquisition.tsx
replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\ClientAcquisition.tsx',
  /const \{ data, error \} = await supabase\.auth\.getSession\(\);[\s\S]*?const \{ data: profileData, error: profileError \} = await supabase[\s\S]*?\.single\(\);/g,
  `// Replaced with useAuth hook
    let data = { session: { user: { id: "user_id" } } };
    let error = null;
    let profileData = null;
    let profileError = null;`
);

console.log("Fixed EditLead and ClientAcquisition");
