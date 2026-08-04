const fs = require('fs');
function repl(path, search, replace) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
  console.log('Processed ' + path);
}

// 1. CreateCertificate.tsx
repl('src/pages/documents/CreateCertificate.tsx',
  /const \{ data: compData \} = await vpsDb\s*\.from\("companies"\)\s*\.select\("\*"\)\s*\.eq\("id", profile\.company_id\)\s*\.maybeSingle\(\);/,
  `const resComp = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "companies", action: "select", select: "*", filters: [{ column: "id", type: "eq", value: profile.company_id }], single: true }) }); const { data: compData } = await resComp.json();`
);

// 2. CreateInvoice.tsx
repl('src/pages/documents/CreateInvoice.tsx',
  /const \{ data, error \} = await vpsDb\s*\.from\("export_shipments"\)\s*\.select\("id, shipment_number"\)\s*\.eq\("company_id", companyId\)\s*\.order\("created_at", \{ ascending: false \}\);/,
  `const res = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "export_shipments", action: "select", select: "id, shipment_number", filters: [{ column: "company_id", type: "eq", value: companyId }], order: { column: "created_at", options: { ascending: false } } }) }); const { data, error } = await res.json();`
);
repl('src/pages/documents/CreateInvoice.tsx',
  /const \{ data, error \} = await vpsDb\s*\.from\("export_orders"\)\s*\.select\("id, order_number"\)\s*\.eq\("company_id", companyId\)\s*\.order\("created_at", \{ ascending: false \}\);/,
  `const res2 = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "export_orders", action: "select", select: "id, order_number", filters: [{ column: "company_id", type: "eq", value: companyId }], order: { column: "created_at", options: { ascending: false } } }) }); const { data, error } = await res2.json();`
);

// 3. PackingListPreview.tsx
repl('src/pages/documents/PackingListPreview.tsx',
  /const \{ data: order, error \} = await vpsDb\s*\.from\("export_orders"\)\s*\.select\("id, order_number, destination, packing_details, total_cartons, unit_net_weight, total_net_weight, total_gross_weight, company_id, items:order_items\(\*, product:products\(\*\)\)"\)\s*\.eq\("id", id\)\s*\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "export_orders", action: "select", select: "id, order_number, destination, packing_details, total_cartons, unit_net_weight, total_net_weight, total_gross_weight, company_id, items:order_items(*, product:products(*))", filters: [{ column: "id", type: "eq", value: id }], single: true }) }); const { data: order, error } = await res.json();`
);

// 4. Attendance.tsx
repl('src/pages/employees/Attendance.tsx',
  /const \{ data \} = await vpsDb\s*\.from\("attendance_logs"\)\s*\.select\("id, check_out"\)\s*\.eq\("user_id", session\?\.user\?\.id\)\s*\.gte\("check_in", startOfDay\)\s*\.order\("created_at", \{ ascending: false \}\)\s*\.limit\(1\)\s*\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "attendance_logs", action: "select", select: "id, check_out", filters: [{ column: "user_id", type: "eq", value: session?.user?.id }, { column: "check_in", type: "gte", value: startOfDay }], order: { column: "created_at", options: { ascending: false } }, limit: 1, single: true }) }); const { data } = await res.json();`
);

// 5. EmployeeDirectory.tsx
repl('src/pages/employees/EmployeeDirectory.tsx',
  /const \{ data: sessData \} = await vpsDb\s*\.from\("user_sessions"\)\s*\.select\("\*"\)\s*\.eq\("user_id", emp\.id\)\s*\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "user_sessions", action: "select", select: "*", filters: [{ column: "user_id", type: "eq", value: emp.id }], single: true }) }); const { data: sessData } = await res.json();`
);
