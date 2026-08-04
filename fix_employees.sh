#!/bin/bash
FILE="/root/updated-ERP/adms-sync/routes/employees.js"

# Remove the supabase fallback block from lookup-id route
# This block starts with "console.log(`[Lookup ID] Not found locally, checking Supabase...`);"
# and ends just before "return res.status(404)"
sed -i '/Not found locally, checking Supabase/,/if (data && data.email)/d' "$FILE"

# Also remove the leftover "return res.json" from that block if it's still there
sed -i '/return res.json({ email: data.email, full_name: data.full_name, role: data.role });/d' "$FILE"

# Verify no supabase references remain
echo "=== Remaining supabase references ==="
grep -in 'supabase' "$FILE" || echo "NONE - clean!"

echo ""
echo "=== lookup-id route (should be clean) ==="
grep -A 10 'lookup-id/:id' "$FILE" | head -20
