const fs = require('fs');
const content = fs.readFileSync('adms-sync/server.js', 'utf8');

if (!content.includes("const shipmentsRoutes = require('./routes/shipments');")) {
  let newContent = content.replace(
    "const sessionsRoutes = require('./routes/sessions');",
    "const sessionsRoutes = require('./routes/sessions');\nconst shipmentsRoutes = require('./routes/shipments');"
  );
  
  newContent = newContent.replace(
    "app.use('/api/sessions', sessionsRoutes);",
    "app.use('/api/sessions', sessionsRoutes);\napp.use('/api/shipments', shipmentsRoutes);"
  );
  
  fs.writeFileSync('adms-sync/server.js', newContent, 'utf8');
  console.log("Added shipmentsRoutes to server.js");
} else {
  console.log("shipmentsRoutes already in server.js");
}
