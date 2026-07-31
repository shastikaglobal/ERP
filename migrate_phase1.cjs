const fs = require('fs');
const path = require('path');

const directories = [
    'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\dashboards',
    'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\reports'
];

const tableToRouteMap = {
    'leads': '/api/crm/leads',
    'export_orders': '/api/orders',
    'quotations': '/api/quotations',
    'export_shipments': '/api/shipments',
    'ledgers': '/api/payments/ledgers',
    'profiles': '/api/employees',
    'activity_logs': '/api/analytics/activity_logs',
    'shipment_events': '/api/shipment_events',
    'inventory': '/api/inventory',
    'products': '/api/products',
    'purchase_orders': '/api/purchase_orders',
    'farmers': '/api/farmers',
    'container_types': '/api/settings/container_types'
};

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    let original = content;

    // 1. Remove supabase imports
    content = content.replace(/import\s*\{\s*supabase\s*\}\s*from\s*["']@\/integrations\/supabase\/client["'];?\n?/g, '');
    content = content.replace(/import\s*\{\s*supabase\s*\}\s*from\s*["']\.\.\/\.\.\/lib\/supabase["'];?\n?/g, '');

    // 2. Replace supabase.auth.getSession() with useAuth (or mock if not inside component)
    // Actually, in useQuery, we can just use credentials: 'include'. We don't need the session object directly anymore.
    content = content.replace(/const\s*\{\s*data\s*:\s*\{\s*session\s*\}\s*\}\s*=\s*await\s*supabase\.auth\.getSession\(\);/g, '');
    
    // Remove the headers injection that uses session token
    content = content.replace(/headers\s*:\s*\{\s*['"]Authorization['"]\s*:\s*`Bearer\s*\$\{session\?\.access_token\}`\s*\}/g, "credentials: 'include'");

    // 3. Replace supabase.from('...').select(...) with fetch()
    content = content.replace(/const\s*\{\s*data\s*,\s*error\s*\}\s*=\s*await\s+supabase\s*\.from\(['"]([^'"]+)['"]\)\s*\.select\(['"][^'"]*['"]\)([\s\S]*?);/g, (match, tableName, rest) => {
        const route = tableToRouteMap[tableName] || `/api/${tableName}`;
        return `const res = await fetch('${route}', { credentials: 'include' });
      if (!res.ok) throw new Error('Fetch failed for ${tableName}');
      const data = await res.json();
      const error = null;`;
    });

    content = content.replace(/const\s*\{\s*count\s*,\s*error\s*\}\s*=\s*await\s+supabase\s*\.from\(['"]([^'"]+)['"]\)\s*\.select\(['"][^'"]*['"]\s*,\s*\{\s*count\s*:\s*['"]exact['"][\s\S]*?\)([\s\S]*?);/g, (match, tableName, rest) => {
        const route = tableToRouteMap[tableName] || `/api/${tableName}`;
        return `const res = await fetch('${route}', { credentials: 'include' });
      if (!res.ok) throw new Error('Fetch failed for ${tableName}');
      const data = await res.json();
      const count = data.length || 0;
      const error = null;`;
    });

    // 4. Fallback for any remaining await supabase...
    content = content.replace(/await\s+supabase\s*\.from\(['"]([^'"]+)['"]\)([\s\S]*?);/g, (match, tableName, rest) => {
        const route = tableToRouteMap[tableName] || `/api/${tableName}`;
        return `await fetch('${route}', { credentials: 'include' }); /* Supabase replaced */`;
    });

    // Write back if changed
    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf-8');
        console.log(`Migrated ${filepath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            processFile(fullPath);
        }
    }
}

for (const d of directories) {
    walkDir(d);
}

console.log("Phase 1 Migration Complete");
