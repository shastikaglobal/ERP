const fs = require('fs');
const files = [
  'src/pages/employees/EmployeeDirectory.tsx',
  'src/pages/crm/Performance.tsx',
  'src/context/FarmerContext.tsx'
];

for (let file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('useIsAdminOrManager') && !content.includes('useIsAdminOrManager } from') && !content.includes('import { useIsAdminOrManager')) {
      if (content.includes('import { useAuth } from "@/hooks/useAuth"')) {
        content = content.replace('import { useAuth } from "@/hooks/useAuth"', 'import { useAuth, useIsAdminOrManager } from "@/hooks/useAuth"');
      } else if (content.includes("import { useAuth } from '@/hooks/useAuth'")) {
        content = content.replace("import { useAuth } from '@/hooks/useAuth'", "import { useAuth, useIsAdminOrManager } from '@/hooks/useAuth'");
      } else {
        content = 'import { useIsAdminOrManager } from "@/hooks/useAuth";\n' + content;
      }
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed ' + file);
    }
  }
}
