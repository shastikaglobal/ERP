#!/bin/bash
FILE="/root/updated-ERP/adms-sync/routes/employees.js"

# We will remove from "Not found locally" to the "return res.status(404)" and then manually re-add "return res.status(404)".
sed -i '/Not found locally, checking Supabase/,/return res.status(404).json({ error: .Employee ID not found. });/c\    return res.status(404).json({ error: '"'"'Employee ID not found'"'"' });' "$FILE"

echo "=== lookup-id route ==="
sed -n '160,185p' "$FILE"
