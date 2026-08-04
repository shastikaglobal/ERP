const fs = require('fs');
const file = 'adms-sync/server.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix Supabase wording
content = content.replace(
  'is not mapped to any profile in Supabase.',
  'is not mapped to any profile in the profiles table.'
);

// 2. Mount missing routes
if (!content.includes("app.use('/api/leads'")) {
  content = content.replace(
    "app.use('/api/employees', employeesRoutes);",
    "app.use('/api/employees', employeesRoutes);\napp.use('/api/attendance', require('./routes/attendance'));\napp.use('/api/leads', require('./routes/crm'));\napp.use('/api/crm', require('./routes/crm_api'));\napp.use('/api/inventory', require('./routes/inventory_api'));\napp.use('/api/crm/tasks', require('./routes/crm_tasks'));\napp.use('/api/upload', require('./routes/upload'));"
  );
}

fs.writeFileSync(file, content);
console.log("Fixed wording and mounted routes.");
