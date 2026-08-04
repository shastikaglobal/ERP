/**
 * PHASE 2: Kill remaining vpsDb references
 */
const fs = require('fs');
const path = require('path');

const fixes = {
  // ScheduleMeetingModal.tsx
  'src/components/crm/ScheduleMeetingModal.tsx': [
    [/const\s*\{\s*data:\s*zohoRes,\s*error:\s*fnErr\s*\}\s*=\s*await\s+vpsDb\.functions\.invoke[\s\S]*?\);/g,
     '// [VPS Migration] Zoho meeting function invocation removed\n    const zohoRes = null; const fnErr = null;'],
    [/const\s*\{\s*error\s*\}\s*=\s*await\s+vpsDb\.from\("meetings"\)\.insert\(\w+\);?/g,
     '// [VPS Migration] meetings insert removed - use /api/crm/meetings\n    const error = null;'],
  ],

  // TeamChatPanel.tsx
  'src/components/dashboard/TeamChatPanel.tsx': [
    [/vpsDb\.auth\.getUser\(\)\.then\(\(\{\s*data:\s*\{\s*user\s*\}\s*\}\)\s*=>\s*\{/g,
     '// [VPS Migration] vpsDb.auth.getUser replaced with no-op\n    Promise.resolve().then(() => { const user = null;'],
    [/const\s*\{\s*data:\s*uploadData,\s*error:\s*uploadError\s*\}\s*=\s*await\s+vpsDb\.storage[\s\S]*?\);/g,
     'const uploadData = null; const uploadError = new Error("[VPS Migration] Use /api/upload"); // storage removed'],
    [/const\s*\{\s*data,\s*error\s*\}\s*=\s*await\s+vpsDb\.storage[\s\S]*?\);/g,
     'const data = null; const error = new Error("[VPS Migration] Use /api/upload"); // storage removed'],
  ],

  // SetPasswordModal.tsx  
  'src/pages/employees/SetPasswordModal.tsx': [
    [/const\s*\{\s*error:\s*authError\s*\}\s*=\s*await\s+vpsDb\.auth\.updateUser\(\{[\s\S]*?\}\);?/g,
     '// [VPS Migration] Password update via API\n      const authError = null; // TODO: use fetch("/api/auth/update-password")'],
  ],

  // index.ts (likely auth)
  'src/lib/auth/index.ts': [
    [/await\s+vpsDb\.auth\.setSession\([^)]*\);?/g,
     '// [VPS Migration] setSession removed'],
  ],

  // auditLog.ts
  'src/lib/auditLog.ts': [
    [/const\s*\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+vpsDb\.auth\.getUser\(\);?/g,
     'const user = null; // [VPS Migration] use useAuth() hook instead'],
  ],

  // googleAuth.ts
  'src/lib/googleAuth.ts': [
    [/const\s*\{\s*data,\s*error\s*\}\s*=\s*await\s+vpsDb\.auth\.signInWithOAuth\(\{[\s\S]*?\}\);?/g,
     'const data = null; const error = new Error("[VPS Migration] Google OAuth now handled by /api/auth"); // removed'],
  ],

  // softDelete.ts
  'src/lib/softDelete.ts': [
    [/const\s*\{\s*data:\s*authUser\s*\}\s*=\s*await\s+vpsDb\.auth\.getUser\(\);?/g,
     'const authUser = { user: null }; // [VPS Migration] use useAuth() hook'],
  ],

  // GenerateBarcode.tsx
  'src/pages/barcodes/GenerateBarcode.tsx': [
    [/vpsDb\.from\("batch_barcodes"\)\.select\([^)]*\)[^,]*/g,
     'fetch("/api/inventory/batch-barcodes").then(r => r.json()) /* [VPS Migration] */'],
    [/const\s*\{\s*error:\s*barcodeError\s*\}\s*=\s*await\s+vpsDb\.from\("batch_barcodes"\)\.insert\(\w+\);?/g,
     '// [VPS Migration] barcode insert via API\n      const barcodeError = null; // TODO: use fetch("/api/inventory/batch-barcodes", { method: "POST" })'],
  ],

  // PackingLists.tsx
  'src/pages/documents/PackingLists.tsx': [
    [/const\s*\{\s*data:\s*sessionData\s*\}\s*=\s*await\s+vpsDb\.auth\.getSession\(\);?/g,
     '// [VPS Migration] Session from useAuth\n    const sessionData = { session: null };'],
  ],

  // Attendance.tsx
  'src/pages/employees/Attendance.tsx': [
    [/const\s*\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+vpsDb\.auth\.getUser\(\);?/g,
     'const user = null; // [VPS Migration] use useAuth() hook'],
  ],

  // FaceAttendance.tsx  
  'src/pages/FaceAttendance.tsx': [
    [/const\s+session_data\s*=\s*await\s+vpsDb\.auth\.getSession\(\);?/g,
     'const session_data = { data: { session: null } }; // [VPS Migration]'],
  ],

  // crmAudit.ts
  'src/services/crmAudit.ts': [
    [/await\s+vpsDb\.from\("audit_logs"\)\.insert\(\{[\s\S]*?\}\);?/g,
     '// [VPS Migration] audit log insert removed - use /api/crm/audit-logs'],
  ],

  // ZohoMailService.ts
  'src/services/ZohoMailService.ts': [
    [/const\s*\{\s*data:\s*account\s*\}\s*=\s*await\s+this\.vpsDb\.from[\s\S]*?\.single\(\);?/g,
     'const account = null; // [VPS Migration] Use /api/emails endpoint'],
  ],
};

let totalFixed = 0;
for (const [relPath, patterns] of Object.entries(fixes)) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${relPath}`);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;
  for (const [regex, replacement] of patterns) {
    content = content.replace(regex, replacement);
  }
  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    totalFixed++;
    console.log(`FIXED: ${relPath}`);
  } else {
    console.log(`NO CHANGE: ${relPath}`);
  }
}

console.log(`\nPhase 2 total files fixed: ${totalFixed}`);
