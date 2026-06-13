const fs = require('fs');
const path = require('path');

const dir = 'd:/ERP/ERP/src/pages/inventory';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let totalChanged = 0;

for (const f of files) {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  let changed = false;

  // Replace insert array
  const insertRegex = /const\s+{\s*error\s*}\s*=\s*await\s+supabase\.from\(['"]([^'"]+)['"]\)\.insert\(([^)]+)\);/g;
  c = c.replace(insertRegex, (match, table, payload) => {
    changed = true;
    const api = ['warehouses', 'warehouse_locations', 'receiving_goods'].includes(table) ? 'warehouse' : 'inventory';
    return `const { data: { session: __session_ins } } = await supabase.auth.getSession();
        const __res_ins = await fetch(\`/api/${api}/${table}\`, {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${__session_ins?.access_token}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(${payload})
        });
        const error = __res_ins.ok ? null : new Error('Insert failed');`;
  });

  // Replace update eq
  const updateRegex = /const\s+{\s*error\s*}\s*=\s*await\s+supabase\.from\(['"]([^'"]+)['"]\)\.update\(([^)]+)\)\.eq\(['"]([^'"]+)['"]\s*,\s*([^)]+)\);/g;
  c = c.replace(updateRegex, (match, table, payload, eqKey, eqVal) => {
    changed = true;
    const api = ['warehouses', 'warehouse_locations', 'receiving_goods'].includes(table) ? 'warehouse' : 'inventory';
    return `const { data: { session: __session_upd } } = await supabase.auth.getSession();
        const __res_upd = await fetch(\`/api/${api}/${table}/\${${eqVal}}\`, {
          method: 'PUT',
          headers: {
            'Authorization': \`Bearer \${__session_upd?.access_token}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(${payload})
        });
        const error = __res_upd.ok ? null : new Error('Update failed');`;
  });

  // Replace select single
  const selectRegex = /const\s+{\s*data\s*,\s*error\s*}\s*=\s*await\s+supabase\.from\(['"]([^'"]+)['"]\)\.select\(['"][^'"]+['"]\);/g;
  c = c.replace(selectRegex, (match, table) => {
    changed = true;
    const api = ['warehouses', 'warehouse_locations', 'receiving_goods'].includes(table) ? 'warehouse' : 'inventory';
    return `const { data: { session: __session_sel } } = await supabase.auth.getSession();
        const __res_sel = await fetch(\`/api/${api}/${table}\`, {
          headers: { 'Authorization': \`Bearer \${__session_sel?.access_token}\` }
        });
        const data = __res_sel.ok ? await __res_sel.json() : null;
        const error = __res_sel.ok ? null : new Error('Select failed');`;
  });

  // Replace Promise.all selects
  const promiseSelectRegex = /supabase\.from\(['"]([^'"]+)['"]\)\.select\(['"][^'"]+['"]\)/g;
  c = c.replace(promiseSelectRegex, (match, table) => {
     if (match.includes('await')) return match; 
     changed = true;
     const api = ['warehouses', 'warehouse_locations', 'receiving_goods'].includes(table) ? 'warehouse' : 'inventory';
     return `(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(\`/api/${api}/${table}\`, {
            headers: { 'Authorization': \`Bearer \${session?.access_token}\` }
          });
          return { data: res.ok ? await res.json() : null };
        })()`;
  });

  if (changed) {
    fs.writeFileSync(p, c);
    console.log('Migrated', f);
    totalChanged++;
  }
}

console.log('Total files migrated:', totalChanged);
