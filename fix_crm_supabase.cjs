const fs = require('fs');

function replaceInFile(filePath, searchRegex, replaceStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchRegex, replaceStr);
  fs.writeFileSync(filePath, content, 'utf8');
}

// 1. EmailIntegration.tsx
replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\EmailIntegration.tsx',
  /const \{ data: comp, error \} = await supabase\.from\("companies"\)\.select\("\*"\)\.eq\("id", profile\.company_id\)\.single\(\);/g,
  `const res = await fetch(\`/api/companies/\${profile.company_id}\`, { credentials: 'include' });
      const comp = await res.json().catch(() => null);
      const error = res.ok ? null : new Error('Failed');`
);

replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\EmailIntegration.tsx',
  /const \{ data: comp2, error: err2 \} = await supabase[\s\S]*?\.single\(\);/g,
  `const res2 = await fetch(\`/api/companies/\${profile.company_id}\`, { credentials: 'include' });
      const comp2 = await res2.json().catch(() => null);
      const err2 = res2.ok ? null : new Error('Failed');`
);

replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\EmailIntegration.tsx',
  /const \{ data: emailData \} = await supabase[\s\S]*?\.limit\(50\);/g,
  `const emRes = await fetch('/api/emails', { credentials: 'include' });
      const emailData = await emRes.json().catch(() => []);`
);

replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\EmailIntegration.tsx',
  /const \{ data, error \} = await supabase\.functions\.invoke\("sync-emails", \{[\s\S]*?\}\);/g,
  `const res = await fetch('/api/emails/sync', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => null);
      const error = res.ok ? null : new Error('Failed');`
);

replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\EmailIntegration.tsx',
  /const \{ error \} = await supabase\.from\("companies"\)\.update\(updateData\)\.eq\("id", profile\.company_id\);/g,
  `const res = await fetch(\`/api/companies/\${profile.company_id}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
    const error = res.ok ? null : new Error('Failed');`
);

// 2. Communication.tsx
replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\Communication.tsx',
  /const \{ data: roomData \} = await supabase\.functions\.invoke\("zoho-meeting", \{[\s\S]*?\}\);/g,
  `const rRes = await fetch('/api/crm/zoho-meeting', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: "create" }) });
            const roomData = await rRes.json().catch(() => null);`
);

replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\Communication.tsx',
  /await supabase\.from\("profiles"\)\.update\(\{ zoho_meeting_link: roomData\.join_url \}\)\.eq\("id", profile\.id\);/g,
  `await fetch(\`/api/employees/\${profile.id}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zoho_meeting_link: roomData.join_url }) });`
);

replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\Communication.tsx',
  /const \{ data: prof \} = await supabase\.from\("profiles"\)\.select\("zoho_meeting_link"\)\.eq\("id", profile\.id\)\.single\(\);/g,
  `const pRes = await fetch(\`/api/employees/\${profile.id}\`, { credentials: 'include' });
              const prof = await pRes.json().catch(() => null);`
);

replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\Communication.tsx',
  /const \{ data: zohoRes \} = await supabase\.functions\.invoke\("zoho-meeting", \{[\s\S]*?\}\);/g,
  `const rRes2 = await fetch('/api/crm/zoho-meeting', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: "create" }) });
        const zohoRes = await rRes2.json().catch(() => null);`
);

console.log("Remaining CRM supabase fixes done");
