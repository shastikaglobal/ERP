import re

with open('src/pages/documents/PackingLists.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'const sessionData = \{ session: null \};\s+const token = sessionData\.session\?\.access_token;', 'const token = session?.access_token;', text)

with open('src/pages/documents/PackingLists.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

with open('src/pages/employees/Attendance.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

if 'import { useAuth }' not in text:
    text = text.replace('import { Dialog, DialogContent', 'import { useAuth } from "@/hooks/useAuth";\nimport { Dialog, DialogContent')

text = text.replace('export default function Attendance() {\n  const [loading', 'export default function Attendance() {\n  const { session, user } = useAuth();\n  const [loading')

text = re.sub(r'const \{ user \} = \{\} as any; // \[VPS Migration\] fixed assignment', '', text)

text = text.replace('empSession?.access_token', 'session?.access_token')

with open('src/pages/employees/Attendance.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
