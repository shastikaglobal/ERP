#!/bin/bash
# Patch server.js to add missing route mounts
FILE="/root/updated-ERP/adms-sync/server.js"

# Check if employees route is already mounted
if grep -q "api/employees" "$FILE"; then
  echo "employees route already mounted"
else
  # Insert before the /api/follow-ups line
  sed -i "s|app.use('/api/follow-ups'|app.use('/api/employees', require('./routes/employees'));\napp.use('/api/attendance', require('./routes/attendance'));\napp.use('/api/crm', require('./routes/crm_api'));\napp.use('/api/inventory', require('./routes/inventory_api'));\napp.use('/api/crm-tasks', require('./routes/crm_tasks'));\napp.use('/api/upload', require('./routes/upload'));\napp.use('/api/follow-ups'|" "$FILE"
  echo "Routes inserted"
fi

# Verify
echo "=== All app.use calls ===" 
grep "app.use('/api/" "$FILE"
