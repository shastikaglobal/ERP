import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Helper: recursively find files
function getFiles(dir, fileList = [], excludeDirs = ['node_modules', '.git', 'dist', 'build', '.vercel', 'backups']) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!excludeDirs.includes(file)) {
        getFiles(filePath, fileList, excludeDirs);
      }
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// ----------------------------------------------------
// 1. ROUTING / NAVIGATION CHECK
// ----------------------------------------------------
console.log("Analyzing Routing & Links...");

const appFile = path.join(rootDir, 'src', 'App.tsx');
const routePaths = [];
const appLines = fs.readFileSync(appFile, 'utf8').split('\n');
const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["']/g;

appLines.forEach((line, index) => {
  // Simple check to skip commented out lines
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('{/*')) return;
  
  let match;
  while ((match = routeRegex.exec(line)) !== null) {
    const rPath = match[1];
    routePaths.push({
      path: rPath,
      line: index + 1,
      file: 'src/App.tsx'
    });
  }
});

// Add index redirect/aliases if they exist implicitly
console.log(`Found ${routePaths.length} route paths defined in App.tsx.`);

// Load navigation.ts to inspect sidebar urls
const navFile = path.join(rootDir, 'src', 'config', 'navigation.ts');
const navUrls = [];
if (fs.existsSync(navFile)) {
  const navContent = fs.readFileSync(navFile, 'utf8');
  // Find URL lines, e.g., url: "/dashboards/executive"
  const urlRegex = /url:\s*["']([^"']+)["']/g;
  let match;
  while ((match = urlRegex.exec(navContent)) !== null) {
    navUrls.push({
      url: match[1],
      file: 'src/config/navigation.ts'
    });
  }
}

// Scan all frontend source files for Links, navigate(), hrefs, and custom buttons
const frontendFiles = getFiles(path.join(rootDir, 'src'));
const linkReferences = [];

frontendFiles.forEach(file => {
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  // Skip App.tsx to avoid detecting the definitions themselves as links, 
  // but keep track of Link components within it if any
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Search patterns:
  // 1. Link / NavLink to: <Link to="/path" ...> or to={"/path"} or to={`/path`}
  const linkToRegex = /to=(?:{["']([^"']+)["']}|{`([^`]+)`}|["']([^"']+)["'])/g;
  
  // 2. navigate("path") or navigate('path') or navigate(`path`)
  const navigateRegex = /navigate\(\s*(?:["']([^"']+)["']|`([^`]+)`)/g;
  
  // 3. href="/path" or href={`/path`} or href='...
  const hrefRegex = /href=(?:{["']([^"']+)["']}|{`([^`]+)`}|["']([^"']+)["'])/g;

  lines.forEach((line, index) => {
    if (line.trim().startsWith('//')) return; // skip comments
    
    let match;
    // Link to
    linkToRegex.lastIndex = 0;
    while ((match = linkToRegex.exec(line)) !== null) {
      const url = match[1] || match[2] || match[3];
      if (url && !url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
        linkReferences.push({
          url,
          file: relPath,
          line: index + 1,
          type: 'Link/NavLink'
        });
      }
    }

    // navigate
    navigateRegex.lastIndex = 0;
    while ((match = navigateRegex.exec(line)) !== null) {
      const url = match[1] || match[2];
      if (url && !url.startsWith('http') && !url.startsWith('-') && isNaN(Number(url))) {
        linkReferences.push({
          url,
          file: relPath,
          line: index + 1,
          type: 'navigate()'
        });
      }
    }

    // href
    hrefRegex.lastIndex = 0;
    while ((match = hrefRegex.exec(line)) !== null) {
      const url = match[1] || match[2] || match[3];
      if (url && !url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('#')) {
        linkReferences.push({
          url,
          file: relPath,
          line: index + 1,
          type: 'href'
        });
      }
    }
  });
});

// Also include navigation config URLs as links
navUrls.forEach(n => {
  linkReferences.push({
    url: n.url,
    file: n.file,
    line: 1,
    type: 'Sidebar Config'
  });
});

// Normalize helper to match path patterns like "/farmers/:id" or "/tally/*"
function routeMatches(linkUrl, routePattern) {
  // Remove query string or hash
  let url = linkUrl.split('?')[0].split('#')[0];
  if (url === '') url = '/';

  // Normalize dynamic references like `${id}` or `${lead.id}` or `${...}` to a placeholder `:id`
  url = url.replace(/\$\{[^}]+\}/g, ':id');
  
  // Normalize string concatenations e.g. "/farmers/" + id or '/farmers/' + lead.id -> /farmers/:id
  url = url.replace(/["']\s*\+\s*[a-zA-Z0-9_\.]+/g, '/:id');
  url = url.replace(/[a-zA-Z0-9_\.]+\s*\+\s*["']/g, '/:id');

  // Convert Route pattern (e.g. "/farmers/:id") to Regex
  // Escape regex chars
  let pattern = routePattern;
  if (pattern.includes('*')) {
    pattern = pattern.replace(/\*/g, '.*');
  }
  
  // Convert placeholders like :id or :id/preview to regex matchers
  const paramRegex = /:[a-zA-Z0-9_]+/g;
  pattern = pattern.replace(paramRegex, '[^/]+');

  const regex = new RegExp(`^${pattern.replace(/\//g, '\\/')}$`);
  
  // Try matching normalized URL
  if (regex.test(url)) return true;

  // Try matching raw URL (for static routes)
  if (regex.test(linkUrl)) return true;

  return false;
}

// Audit routing links
const brokenLinks = [];
const activeRoutes = routePaths.map(r => r.path);
const linkedRoutes = new Set();

linkReferences.forEach(ref => {
  // Check if this link url matches any of the active routes
  const exists = activeRoutes.some(route => {
    const isMatch = routeMatches(ref.url, route);
    if (isMatch) {
      linkedRoutes.add(route);
    }
    return isMatch;
  });

  if (!exists) {
    // Check if it is a standard folder path, external link, or generic relative path
    if (ref.url.startsWith('/') && !ref.url.includes(':') && ref.url !== '/auth/callback') {
      brokenLinks.push(ref);
    }
  }
});

const orphanPages = [];
routePaths.forEach(rp => {
  const isLinked = linkedRoutes.has(rp.path);
  // Exclude root and wildcard
  if (!isLinked && rp.path !== '/' && rp.path !== '*' && rp.path !== '/auth' && rp.path !== '/dashboard') {
    orphanPages.push(rp);
  }
});

// Check homepage section anchor links
const anchorLinks = [];
frontendFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  const anchorRegex = /href=["'](#[a-zA-Z0-9_-]+)["']/g;
  let match;
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    while ((match = anchorRegex.exec(line)) !== null) {
      anchorLinks.push({
        anchor: match[1],
        file: relPath,
        line: index + 1
      });
    }
  });
});

console.log(`Found ${brokenLinks.length} potential broken links.`);
console.log(`Found ${orphanPages.length} potential orphan pages.`);

// ----------------------------------------------------
// 2. DATABASE CHECK — VPA DB
// ----------------------------------------------------
console.log("\nAnalyzing VPA DB references in adms-sync...");

// Get actual tables from the VPS DB export metadata
const dbMetaPath = path.join(__dirname, 'db_audit_metadata.json');
let vpsTablesInDb = [];
let vpsColumnsMap = {};
if (fs.existsSync(dbMetaPath)) {
  const meta = JSON.parse(fs.readFileSync(dbMetaPath, 'utf8'));
  if (meta.vps) {
    vpsTablesInDb = meta.vps.tables || [];
    vpsColumnsMap = meta.vps.columnsMap || {};
  }
}
console.log(`Loaded ${vpsTablesInDb.length} VPS tables from metadata.`);

// Scan adms-sync files for table references in SQL
const syncFiles = getFiles(path.join(rootDir, 'adms-sync'));
const vpsTableRefs = new Map(); // table_name -> array of { file, line }

syncFiles.forEach(file => {
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  // Skip package.json, node_modules etc
  if (file.endsWith('.json') || file.includes('node_modules') || file.endsWith('.md')) return;
  
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // SQL pattern keywords followed by tables in public schema
  // FROM / JOIN / INSERT INTO / UPDATE / DELETE FROM
  const sqlPatterns = [
    /\bfrom\s+([a-zA-Z0-9_"]+)/gi,
    /\bjoin\s+([a-zA-Z0-9_"]+)/gi,
    /\binto\s+([a-zA-Z0-9_"]+)/gi,
    /\bupdate\s+([a-zA-Z0-9_"]+)/gi,
    /\bdelete\s+from\s+([a-zA-Z0-9_"]+)/gi
  ];

  lines.forEach((line, index) => {
    // Skip single-line comments in JavaScript or SQL files
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('--') || trimmed.startsWith('/*')) return;

    sqlPatterns.forEach(pattern => {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        let table = match[1].replace(/"/g, '').toLowerCase();
        
        // Exclude SQL keywords or parameters that get matched
        const keywords = ['select', 'insert', 'update', 'delete', 'where', 'set', 'values', 'returning', 'null', 'and', 'or', 'on', 'in', 'left', 'right', 'inner', 'outer', 'cross', 'natural', 'using', 'as', 'group', 'order', 'by', 'having', 'limit', 'offset'];
        if (keywords.includes(table)) continue;
        if (table.startsWith('$')) continue; // param placeholder
        if (!isNaN(Number(table))) continue; // number

        // If it has a schema prefix e.g. "public.users", strip it
        if (table.includes('.')) {
          table = table.split('.')[1];
        }

        if (!vpsTableRefs.has(table)) {
          vpsTableRefs.set(table, []);
        }
        vpsTableRefs.get(table).push({ file: relPath, line: index + 1 });
      }
    });
  });
});

// Compare VPS DB tables
const referencedVpsTables = Array.from(vpsTableRefs.keys());
const missingVpsTables = []; // tables in code but not in DB
const unusedVpsTables = []; // tables in DB but never in code

referencedVpsTables.forEach(table => {
  // Check if it exists in the VPA DB list
  const exists = vpsTablesInDb.map(t => t.toLowerCase()).includes(table);
  if (!exists) {
    missingVpsTables.push({
      table,
      references: vpsTableRefs.get(table)
    });
  }
});

vpsTablesInDb.forEach(table => {
  const isUsed = vpsTableRefs.has(table.toLowerCase());
  if (!isUsed) {
    unusedVpsTables.push(table);
  }
});

console.log(`VPS DB Check: ${missingVpsTables.length} missing tables referenced in code, ${unusedVpsTables.length} unused tables in DB.`);

// ----------------------------------------------------
// 3. DATABASE CHECK — SUPABASE
// ----------------------------------------------------
console.log("\nAnalyzing Supabase DB references in frontend...");

const sbMetaPath = path.join(__dirname, 'supabase_openapi_metadata.json');
let sbTablesInDb = {};
let sbRpcsInDb = [];
if (fs.existsSync(sbMetaPath)) {
  const meta = JSON.parse(fs.readFileSync(sbMetaPath, 'utf8'));
  sbTablesInDb = meta.tables || {};
  sbRpcsInDb = meta.rpcs || [];
}
console.log(`Loaded ${Object.keys(sbTablesInDb).length} Supabase tables from OpenAPI metadata.`);

// Scan frontend files for supabase queries
const sbTableRefs = new Map(); // table_name -> array of { file, line, columnsReferenced }
const sbRpcRefs = new Map();   // rpc_name -> array of { file, line }

frontendFiles.forEach(file => {
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Supabase syntax: supabase.from('table_name')
  const fromRegex = /supabase(?:\(\))?\.from\(['"]([^'"]+)['"]\)/g;
  // RPC: supabase.rpc('rpc_name')
  const rpcRegex = /supabase(?:\(\))?\.rpc\(['"]([^'"]+)['"]\)/g;

  lines.forEach((line, index) => {
    if (line.trim().startsWith('//')) return;

    let match;
    // .from('...')
    fromRegex.lastIndex = 0;
    while ((match = fromRegex.exec(line)) !== null) {
      const table = match[1];
      if (!sbTableRefs.has(table)) {
        sbTableRefs.set(table, []);
      }

      // Try to parse columns referenced in nearby select/insert/update statements
      // We look at the next few lines in the file
      const cols = [];
      const windowSize = 15;
      const start = index;
      const end = Math.min(lines.length, index + windowSize);
      const lookahead = lines.slice(start, end).join(' ');

      // 1. Select columns: .select('col1, col2, relation(col3)')
      const selectMatch = /\.select\(\s*[`'"]([^`'"]+)[`'"]\s*\)/.exec(lookahead);
      if (selectMatch) {
        const selectStr = selectMatch[1];
        // Split by commas, filter, and extract word tokens
        const tokens = selectStr.split(/[\s,()]+/).map(t => t.trim()).filter(t => t && t !== '*' && !t.includes(':') && isNaN(Number(t)));
        tokens.forEach(t => {
          if (!cols.includes(t)) cols.push(t);
        });
      }

      // 2. Insert/Update keys: .insert({ col1: val }) or .update({ col1: val })
      // Match object keys in JSON or JS object formats
      const keysRegex = /([a-zA-Z0-9_]+)\s*:/g;
      const insertUpdateMatch = /\.(?:insert|update|upsert)\(\s*\[?\s*\{([^}]+)\}/.exec(lookahead);
      if (insertUpdateMatch) {
        const objStr = insertUpdateMatch[1];
        let keyMatch;
        while ((keyMatch = keysRegex.exec(objStr)) !== null) {
          const k = keyMatch[1];
          if (!cols.includes(k) && k !== 'id' && k !== 'created_at') cols.push(k);
        }
      }

      sbTableRefs.get(table).push({
        file: relPath,
        line: index + 1,
        columns: cols
      });
    }

    // .rpc('...')
    rpcRegex.lastIndex = 0;
    while ((match = rpcRegex.exec(line)) !== null) {
      const rpc = match[1];
      if (!sbRpcRefs.has(rpc)) {
        sbRpcRefs.set(rpc, []);
      }
      sbRpcRefs.get(rpc).push({
        file: relPath,
        line: index + 1
      });
    }
  });
});

// Compare Supabase Tables and columns
const referencedSbTables = Array.from(sbTableRefs.keys());
const missingSbTables = [];   // tables in code but not in Supabase schema
const missingSbColumns = [];  // columns in code but not in Supabase table
const unusedSbTables = [];     // tables in Supabase DB but never in code
const referencedSbRpcs = Array.from(sbRpcRefs.keys());
const missingSbRpcs = [];

referencedSbTables.forEach(table => {
  const actualCols = sbTablesInDb[table];
  if (!actualCols) {
    missingSbTables.push({
      table,
      references: sbTableRefs.get(table)
    });
  } else {
    // Table exists, check columns!
    const refs = sbTableRefs.get(table);
    const colNamesInDb = actualCols.map(c => c.name.toLowerCase());
    
    refs.forEach(ref => {
      ref.columns.forEach(col => {
        // Skip relations (usually start with uppercase or contain tables name) or nested checks
        if (col === 'count' || col === 'error') return;
        if (!colNamesInDb.includes(col.toLowerCase())) {
          // Check if this column could be a table join relation, e.g. "profiles" join.
          // If the token matches another Supabase table, skip as it's likely a join relation, not a column
          if (Object.keys(sbTablesInDb).includes(col)) return;

          missingSbColumns.push({
            table,
            column: col,
            file: ref.file,
            line: ref.line
          });
        }
      });
    });
  }
});

// Check missing RPCs
referencedSbRpcs.forEach(rpc => {
  if (!sbRpcsInDb.includes(rpc)) {
    missingSbRpcs.push({
      rpc,
      references: sbRpcRefs.get(rpc)
    });
  }
});

// Check unused Supabase tables
Object.keys(sbTablesInDb).forEach(table => {
  if (!sbTableRefs.has(table)) {
    unusedSbTables.push(table);
  }
});

// Check RLS policies from migrations
// We want to scan migrations sql files to see if each Supabase table has RLS enabled and policies defined.
const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
const migrationFiles = getFiles(migrationsDir).filter(f => f.endsWith('.sql'));

const rlsEnabledTables = new Set();
const policyTables = new Set();

migrationFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;
  const enableRlsRegex = /alter\s+table\s+(?:public\.)?([a-zA-Z0-9_]+)\s+enable\s+row\s+level\s+security/gi;
  let match;
  while ((match = enableRlsRegex.exec(content)) !== null) {
    rlsEnabledTables.add(match[1].toLowerCase());
  }

  // CREATE POLICY <policy> ON public.<name> ...
  const policyRegex = /create\s+policy\s+(?:["'][^"']+["']|[a-zA-Z0-9_]+)\s+on\s+(?:public\.)?([a-zA-Z0-9_]+)/gi;
  while ((match = policyRegex.exec(content)) !== null) {
    policyTables.add(match[1].toLowerCase());
  }
});

// Check which of the active Supabase tables (referenced or defined) are missing RLS in migrations
const tablesMissingRls = [];
const tablesMissingPolicies = [];

Object.keys(sbTablesInDb).forEach(table => {
  const lowerTable = table.toLowerCase();
  // Skip views, metadata tables, or default supabase schema tables (e.g. schema_migrations, view_...)
  if (lowerTable.startsWith('view_') || lowerTable === 'schema_migrations' || lowerTable === 'pg_stat_statements') return;

  const rlsEnabled = rlsEnabledTables.has(lowerTable);
  const hasPolicies = policyTables.has(lowerTable);

  if (!rlsEnabled) {
    tablesMissingRls.push(table);
  } else if (!hasPolicies) {
    tablesMissingPolicies.push(table);
  }
});

console.log(`Supabase Check: ${missingSbTables.length} missing tables, ${missingSbColumns.length} missing columns, ${missingSbRpcs.length} missing RPCs.`);
console.log(`RLS Check: ${tablesMissingRls.length} tables lack RLS enable in migrations, ${tablesMissingPolicies.length} tables have RLS enabled but lack policies.`);

// ----------------------------------------------------
// 4. WRITE RESULT TO JSON
// ----------------------------------------------------
const auditResult = {
  routing: {
    definedRoutesCount: routePaths.length,
    activeRoutes,
    brokenLinks,
    orphanPages,
    anchorLinks
  },
  vpsDb: {
    tablesInDbCount: vpsTablesInDb.length,
    missingTables: missingVpsTables,
    unusedTables: unusedVpsTables
  },
  supabaseDb: {
    tablesInDbCount: Object.keys(sbTablesInDb).length,
    missingTables: missingSbTables,
    missingColumns: missingSbColumns,
    missingRpcs: missingSbRpcs,
    unusedTables: unusedSbTables,
    tablesMissingRls,
    tablesMissingPolicies
  }
};

fs.writeFileSync(path.join(__dirname, 'audit_report_data.json'), JSON.stringify(auditResult, null, 2));
console.log("\nFull Audit Report data saved to scratch/audit_report_data.json");
