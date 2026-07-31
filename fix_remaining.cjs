const fs = require('fs');

function replaceInFile(filePath, searchRegex, replaceStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchRegex, replaceStr);
  fs.writeFileSync(filePath, content, 'utf8');
}

// 1. CreatePO.tsx
replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\procurement\\CreatePO.tsx',
  /useEffect\(\(\) => \{\s*supabase\.from\('farmers'\)\s*\.select\('id, full_name'\)\s*\.eq\('is_deleted', false\)\s*\.then\(\(\{ data \}\) => setFarmers\(data \|\| \[\]\)\);\s*\}, \[\]\);/g,
  `useEffect(() => {
    fetch('/api/farmers', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setFarmers(data || []))
      .catch(err => console.error("Failed to fetch farmers", err));
  }, []);`
);

replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\procurement\\CreatePO.tsx',
  /if \(session\?\.user\?\.id\) \{\s*const profileRes = await supabase\.from\('profiles'\)\.select\('company_id'\)\.eq\('id', session\.user\.id\)\.single\(\);\s*if \(profileRes\.data\?\.company_id\) \{\s*companyId = profileRes\.data\.company_id;\s*\}\s*\}/g,
  `if (session?.user?.id) {
        // Handled by profile context or backend
      }`
);

// 2. ConvertToCustomer.tsx
replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\farmers\\ConvertToCustomer.tsx',
  /const \{ data: farmersData, error: farmersError \} = await supabase\s*\.from\("farmers"\)\s*\.select\([^)]+\)\s*\.neq\("is_deleted", true\)\s*\.order\([^)]+\);\s*if \(farmersError\) throw farmersError;\s*if \(\!farmersData \|\| farmersData\.length === 0\) return \[\] as Farmer\[\];\s*\/\/\s*[^\n]+\s*const \{ data: convertedData \} = await supabase\s*\.from\("customers"\)\s*\.select\("farmer_id"\)\s*\.not\("farmer_id", "is", null\);/g,
  `const res = await fetch('/api/farmers', { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch farmers");
      const farmersData = await res.json();
      if (!farmersData || farmersData.length === 0) return [] as Farmer[];

      const custRes = await fetch('/api/customers', { credentials: 'include' });
      const custData = await custRes.json().catch(() => []);
      const convertedData = custData.filter((c: any) => c.farmer_id);`
);

// 3. FarmerDetail.tsx
replaceInFile(
  'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\farmers\\FarmerDetail.tsx',
  /const \{ data, error \} = await supabase\s*\.from\('farmers'\)\s*\.select\('\*'\)\s*\.eq\('id', id\)\s*\.single\(\);/g,
  `const res = await fetch(\`/api/farmers/\${id}\`, { credentials: 'include' });
      const data = await res.json();
      const error = res.ok ? null : new Error('Failed to fetch');`
);

console.log("Supabase cleanup done");
