const fs = require('fs');
const file = 'adms-sync/server.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("app.use('/api/employees', employeesRoutes);")) {
  content = content.replace(
    "app.use('/api/permissions', permissionsRoutes);",
    "app.use('/api/permissions', permissionsRoutes);\napp.use('/api/employees', employeesRoutes);"
  );
  fs.writeFileSync(file, content);
  console.log("Added app.use('/api/employees', employeesRoutes);");
} else {
  console.log("Route already registered");
}
