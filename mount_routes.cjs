const fs = require('fs');
const file = 'adms-sync/server.js';
let content = fs.readFileSync(file, 'utf8');

const missingRequires = `const crmRoutes = require('./routes/crm');`;
if (!content.includes(missingRequires)) {
  content = content.replace("const crmApi = require('./routes/crm_api');", "const crmApi = require('./routes/crm_api');\nconst crmRoutes = require('./routes/crm');");
}

const missingMounts = `
app.use('/api/employees', employeesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/crm', crmApi);
app.use('/api/leads', crmRoutes);
app.use('/api/inventory', inventoryApi);
app.use('/api/crm-tasks', crmTasksRoutes);
app.use('/api/upload', uploadRoutes);
`;

if (!content.includes("app.use('/api/leads', crmRoutes);")) {
  content = content.replace("app.use('/api/follow-ups', followUpsRoutes);", missingMounts + "\napp.use('/api/follow-ups', followUpsRoutes);");
  fs.writeFileSync(file, content, 'utf8');
  console.log("Routes mounted successfully in server.js");
} else {
  console.log("Routes already mounted");
}
