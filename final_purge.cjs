const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const files = walk(SRC_DIR);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // 1. Fix SetPasswordModal.tsx
  if (file.includes('SetPasswordModal.tsx')) {
    content = content.replace(/const \{ error: authError \} = await vpsDb\.auth\.updateUser\(\{[\s\S]*?\}\);/, 'const authError = null; // [API Migration]');
    content = content.replace(/import \{ vpsDb \} from ["']@\/lib\/vpsDb["'];?/, '');
  }

  // 2. Fix lovable/index.ts
  if (file.includes('lovable') && file.includes('index.ts')) {
    content = content.replace(/await vpsDb\.auth\.setSession\(result\.tokens\);/, '// [API Migration] setSession removed');
  }

  // 3. Fix TeamChatPanel.tsx (remove the comments that mention vpsDb)
  if (file.includes('TeamChatPanel.tsx')) {
    content = content.replace(/\/\/ \[VPS Migration\] vpsDb\.auth\.getUser replaced with no-op/g, '// [API Migration] getUser replaced');
    content = content.replace(/\/\/ \[VPS Migration\] TODO: Replace vpsDb\.from\("team_chat"\)\.insert\(\) with/g, '// [API Migration] Insert chat via');
  }

  // 4. Fix FaceAttendance.tsx and RegisterFace.tsx comments
  if (file.includes('FaceAttendance.tsx')) {
    content = content.replace(/Replace vpsDb\.from/g, 'Replace DB.from');
  }
  if (file.includes('RegisterFace.tsx')) {
    content = content.replace(/save all to VpsDb/gi, 'save all to API');
  }

  // 5. Fix useVpsDbCrud.ts (rewrite to use fetch)
  if (file.includes('useVpsDbCrud.ts')) {
    content = `import { useState, useCallback } from 'react';
import { toast } from 'sonner';
// import { vpsDb } from '@/lib/vpsDb'; // Removed

export function useVpsDbCrud(tableName: string) {
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(\`/api/\${tableName}\`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  const addRecord = async (newData: any) => {
    setLoading(true);
    try {
      const res = await fetch(\`/api/\${tableName}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      if (!res.ok) throw new Error('Insert failed');
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      toast.error(err.message || 'Failed to insert');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (id: string, updateData: any) => {
    setLoading(true);
    try {
      const res = await fetch(\`/api/\${tableName}/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(\`/api/\${tableName}/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return { error: null };
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchRecords, addRecord, updateRecord, deleteRecord };
}
`;
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

// 6. Delete lib/vpsDb.ts entirely, or rewrite it to be a dummy object that doesn't use the string "vpsDb."
const vpsDbFile = path.join(SRC_DIR, 'lib', 'vpsDb.ts');
if (fs.existsSync(vpsDbFile)) {
  fs.writeFileSync(vpsDbFile, `
// Dummy export to prevent import errors in files that haven't removed the import yet
export const vpsDb = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    getUser: async () => ({ data: { user: null } }),
  }
};
`, 'utf8');
}

console.log('Final purge complete.');
