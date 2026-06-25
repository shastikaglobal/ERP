import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const auditData = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit_report_data.json'), 'utf8'));

console.log("=== POTENTIAL ORPHAN PAGES ===");
console.log("Count:", auditData.routing.orphanPages.length);
console.log(auditData.routing.orphanPages.map(op => `${op.path} (App.tsx:${op.line})`).join('\n'));

console.log("\n=== BROKEN LINKS ===");
console.log("Count:", auditData.routing.brokenLinks.length);
if (auditData.routing.brokenLinks.length > 0) {
  console.log(auditData.routing.brokenLinks.map(bl => `${bl.url} referenced in ${bl.file}:${bl.line} (via ${bl.type})`).join('\n'));
}

console.log("\n=== MISSING VPS TABLES (referenced in code but not in DB) ===");
console.log("Count:", auditData.vpsDb.missingTables.length);
auditData.vpsDb.missingTables.forEach(t => {
  console.log(`- Table: ${t.table}`);
  t.references.slice(0, 5).forEach(r => {
    console.log(`    Ref: ${r.file}:${r.line}`);
  });
  if (t.references.length > 5) {
    console.log(`    ... and ${t.references.length - 5} more references`);
  }
});

console.log("\n=== UNUSED VPS TABLES (in DB but not referenced in code) ===");
console.log("Count:", auditData.vpsDb.unusedTables.length);
console.log(auditData.vpsDb.unusedTables.slice(0, 15).join(', ') + (auditData.vpsDb.unusedTables.length > 15 ? ' ...' : ''));

console.log("\n=== MISSING SUPABASE TABLES ===");
console.log("Count:", auditData.supabaseDb.missingTables.length);
auditData.supabaseDb.missingTables.forEach(t => {
  console.log(`- Table: ${t.table}`);
  t.references.forEach(r => {
    console.log(`    Ref: ${r.file}:${r.line}`);
  });
});

console.log("\n=== MISSING SUPABASE COLUMNS ===");
console.log("Count:", auditData.supabaseDb.missingColumns.length);
auditData.supabaseDb.missingColumns.forEach(c => {
  console.log(`- Column: ${c.table}.${c.column} in ${c.file}:${c.line}`);
});

console.log("\n=== MISSING SUPABASE RPCS ===");
console.log("Count:", auditData.supabaseDb.missingRpcs.length);
auditData.supabaseDb.missingRpcs.forEach(r => {
  console.log(`- RPC: ${r.rpc}`);
  r.references.forEach(ref => {
    console.log(`    Ref: ${ref.file}:${ref.line}`);
  });
});

console.log("\n=== SUPABASE TABLES MISSING RLS IN MIGRATIONS ===");
console.log("Count:", auditData.supabaseDb.tablesMissingRls.length);
console.log(auditData.supabaseDb.tablesMissingRls.join(', '));

console.log("\n=== SUPABASE TABLES WITH RLS BUT MISSING POLICIES IN MIGRATIONS ===");
console.log("Count:", auditData.supabaseDb.tablesMissingPolicies.length);
console.log(auditData.supabaseDb.tablesMissingPolicies.join(', '));
