const fs = require('fs');

let packingLists = fs.readFileSync('src/pages/documents/PackingLists.tsx', 'utf-8');
packingLists = packingLists.replace(/const sessionData = \{ session: null \};\s*const token = sessionData\.session\?\.access_token;/g, 'const token = session?.access_token;');
fs.writeFileSync('src/pages/documents/PackingLists.tsx', packingLists, 'utf-8');

let attendance = fs.readFileSync('src/pages/employees/Attendance.tsx', 'utf-8');
if (!attendance.includes('import { useAuth }')) {
    attendance = attendance.replace('import { Dialog, DialogContent', 'import { useAuth } from "@/hooks/useAuth";\nimport { Dialog, DialogContent');
}
attendance = attendance.replace('export default function Attendance() {\n  const [loading', 'export default function Attendance() {\n  const { session, user } = useAuth();\n  const [loading');
attendance = attendance.replace('const { user } = {} as any; // [VPS Migration] fixed assignment', '');
attendance = attendance.replace(/empSession\?\.access_token/g, 'session?.access_token');
fs.writeFileSync('src/pages/employees/Attendance.tsx', attendance, 'utf-8');
