/**
 * COMPREHENSIVE vpsDb ELIMINATION SCRIPT
 * =======================================
 * Replaces ALL vpsDb.auth.getSession(), vpsDb.removeChannel(), 
 * vpsDb.channel(), vpsDb.from(), vpsDb.auth.signOut(), vpsDb.storage
 * with safe no-ops or useAuth() session patterns.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');

// Recursively find all .ts and .tsx files
function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
  }
  return results;
}

let totalFixed = 0;

for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Skip the definition files themselves
  const rel = path.relative(SRC, file).replace(/\\/g, '/');
  if (rel === 'lib/vpsDb.ts' || rel === 'services/vpsDb.ts' || rel === 'hooks/useVpsDbCrud.ts') continue;

  // 1. Replace `const { data: { session } } = await vpsDb.auth.getSession();` 
  //    with a no-op (session comes from useAuth, not vpsDb)
  content = content.replace(
    /const\s*\{\s*data:\s*\{\s*session(?:\s*:\s*\w+)?\s*\}\s*\}\s*=\s*await\s+vpsDb\.auth\.getSession\(\);?/g,
    '// [VPS Migration] Session now comes from useAuth hook, not vpsDb'
  );

  // 2. Replace `vpsDb.removeChannel(...)` with no-op
  content = content.replace(
    /vpsDb\.removeChannel\([^)]*\);?/g,
    '// [VPS Migration] Realtime channel removed (not needed with REST API)'
  );

  // 3. Replace `vpsDb.channel(...)` blocks with no-op  
  content = content.replace(
    /(?:const\s+\w+\s*=\s*)?vpsDb\.channel\([^)]*\)(?:\.on\([^]*?\))*\.subscribe\([^)]*\);?/g,
    '// [VPS Migration] Realtime subscription removed'
  );
  // Simpler single-line channel calls
  content = content.replace(
    /vpsDb\.channel\([^)]*\)\.send\(\{[^}]*\}\);?/g,
    '// [VPS Migration] Realtime broadcast removed'
  );
  content = content.replace(
    /vpsDb\.channel\([^)]*\)/g,
    '({ send: () => {}, subscribe: () => {} }) /* [VPS Migration] channel stub */'
  );

  // 4. Replace `await vpsDb.auth.signOut()` with fetch-based sign out
  content = content.replace(
    /await\s+vpsDb\.auth\.signOut\(\);?/g,
    'await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); // [VPS Migration]'
  );

  // 5. Replace `await vpsDb.auth.exchangeCodeForSession(...)` with no-op
  content = content.replace(
    /const\s*\{\s*error:\s*\w+\s*\}\s*=\s*await\s+vpsDb\.auth\.exchangeCodeForSession\([^)]*\);?/g,
    '// [VPS Migration] OAuth code exchange removed (handled by VPS backend)'
  );

  // 6. Replace `await vpsDb.auth.setSession(...)` with no-op
  content = content.replace(
    /const\s*\{\s*error:\s*\w+\s*\}\s*=\s*await\s+vpsDb\.auth\.setSession\(\{[^}]*\}\);?/g,
    '// [VPS Migration] setSession removed (handled by VPS backend)'
  );

  // 7. Replace `await vpsDb.from('table').insert(...)` with fetch
  content = content.replace(
    /await\s+vpsDb\.from\(['"]([\w_]+)['"]\)\s*\.insert\(\{([^}]*)\}\);?/g,
    '// [VPS Migration] TODO: Replace vpsDb.from("$1").insert() with fetch("/api/$1", { method: "POST" })'
  );
  content = content.replace(
    /await\s+vpsDb\.from\(['"]([\w_]+)['"]\)\s*\.upsert\(\[?\{([^}]*)\}[^;]*;?/g,
    '// [VPS Migration] TODO: Replace vpsDb.from("$1").upsert() with fetch("/api/$1", { method: "POST" })'
  );
  content = content.replace(
    /await\s+vpsDb\.from\(['"]([\w_]+)['"]\)[\s\S]*?\.(?:select|update|delete)\([^)]*\)[\s\S]*?;/g,
    (match) => {
      // Only replace if it's short (single statement)
      if (match.length > 300) return match;
      return '// [VPS Migration] vpsDb query removed - use fetch() API instead';
    }
  );

  // 8. Replace vpsDb.storage calls with no-ops
  content = content.replace(
    /const\s*\{\s*error:\s*\w+\s*\}\s*=\s*await\s+vpsDb\.storage[\s\S]*?;/g,
    (match) => {
      if (match.length > 500) return match;
      return '// [VPS Migration] Storage upload removed - use /api/upload endpoint';
    }
  );
  content = content.replace(
    /const\s*\{\s*data:\s*\{\s*publicUrl\s*\}\s*\}\s*=\s*vpsDb\.storage[\s\S]*?;/g,
    'const publicUrl = ""; // [VPS Migration] Storage URL removed - use /api/upload'
  );
  content = content.replace(
    /const\s*\{\s*data\s*\}\s*=\s*await\s+vpsDb\.storage[\s\S]*?;/g,
    'const data = null; // [VPS Migration] Storage call removed'
  );

  // 9. Replace onClick handlers with vpsDb.storage inline
  content = content.replace(
    /onClick=\{async\s*\(\)\s*=>\s*\{\s*const\s*\{\s*data\s*\}\s*=\s*await\s+vpsDb\.storage\.from\([^)]*\)\.createSignedUrl\([^)]*,\s*\d+\);\s*if\s*\(data\?\.\s*signedUrl\)\s*window\.open\(data\.signedUrl,\s*["']_blank["']\);\s*\}\}/g,
    'onClick={() => { /* [VPS Migration] Attachment download via /api/emails endpoint */ }}'
  );

  // 10. Replace vpsDb.co URL strings
  content = content.replace(
    /https?:\/\/\w+\.vpsDb\.co\/[^"']*/g,
    '/api/placeholder-asset'
  );

  // 11. Clean up import of vpsDb if no longer used
  // Don't remove imports yet - just neutralize usage

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log(`FIXED: ${rel}`);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
