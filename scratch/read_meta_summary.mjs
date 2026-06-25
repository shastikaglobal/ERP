import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbAuditPath = path.join(__dirname, 'db_audit_metadata.json');
const sbOpenApiPath = path.join(__dirname, 'supabase_openapi_metadata.json');

console.log("=== DB AUDIT METADATA ===");
if (fs.existsSync(dbAuditPath)) {
  const content = JSON.parse(fs.readFileSync(dbAuditPath, 'utf8'));
  console.log("Keys in db_audit_metadata.json:", Object.keys(content));
  if (content.vps) {
    console.log("VPS Tables count:", content.vps.tables?.length);
    console.log("VPS Tables sample:", content.vps.tables?.slice(0, 10));
  }
  if (content.supabase) {
    console.log("Supabase Tables count in db_audit_metadata.json:", content.supabase.tables?.length);
    console.log("Supabase RLS Map exists:", !!content.supabase.rlsMap);
  } else {
    console.log("Supabase key is null or missing in db_audit_metadata.json");
  }
} else {
  console.log("db_audit_metadata.json not found");
}

console.log("\n=== SUPABASE OPENAPI METADATA ===");
if (fs.existsSync(sbOpenApiPath)) {
  const content = JSON.parse(fs.readFileSync(sbOpenApiPath, 'utf8'));
  console.log("Keys in supabase_openapi_metadata.json:", Object.keys(content));
  console.log("Tables count:", content.tables ? Object.keys(content.tables).length : 'N/A');
  console.log("Tables sample:", content.tables ? Object.keys(content.tables).slice(0, 10) : 'N/A');
  console.log("RPCs count:", content.rpcs ? content.rpcs.length : 'N/A');
} else {
  console.log("supabase_openapi_metadata.json not found");
}
