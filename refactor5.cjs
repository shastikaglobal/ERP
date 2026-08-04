const fs = require('fs');
function repl(path, search, replace) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
  console.log('Processed ' + path);
}

// 1. CertificatePreview.tsx
repl('src/pages/documents/CertificatePreview.tsx',
  /const \{ data: compData \} = await vpsDb\s*\.from\("companies"\)\s*\.select\("\*"\)\s*\.eq\("id", orderData\.company_id\)\s*\.maybeSingle\(\);/,
  `const resComp = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "companies", action: "select", select: "*", filters: [{ column: "id", type: "eq", value: orderData.company_id }], single: true }) }); const { data: compData } = await resComp.json();`
);
repl('src/pages/documents/CertificatePreview.tsx',
  /const \{ data: userData \} = await vpsDb\s*\.from\("profiles"\)\s*\.select\("full_name"\)\s*\.eq\("id", orderData\.created_by\)\s*\.maybeSingle\(\);/,
  `const resUser = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "profiles", action: "select", select: "full_name", filters: [{ column: "id", type: "eq", value: orderData.created_by }], single: true }) }); const { data: userData } = await resUser.json();`
);

// 2. CreateCertificate.tsx
repl('src/pages/documents/CreateCertificate.tsx',
  /const \{ data: compData \} = await vpsDb\s*\.from\("companies"\)\s*\.select\("id"\)\s*\.eq\("id", companyId\)\s*\.maybeSingle\(\);/,
  `const resComp = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "companies", action: "select", select: "id", filters: [{ column: "id", type: "eq", value: companyId }], single: true }) }); const { data: compData } = await resComp.json();`
);

// 3. CreateInvoice.tsx
repl('src/pages/documents/CreateInvoice.tsx',
  /const \{ data, error \} = await vpsDb\s*\.from\("export_shipments"\)\s*\.select\("id, shipment_number"\)\s*\.order\("created_at", \{ ascending: false \}\);/,
  `const res = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "export_shipments", action: "select", select: "id, shipment_number", order: { column: "created_at", options: { ascending: false } } }) }); const { data, error } = await res.json();`
);
repl('src/pages/documents/CreateInvoice.tsx',
  /const \{ data, error \} = await vpsDb\s*\.from\("export_orders"\)\s*\.select\("id, order_number"\)\s*\.order\("created_at", \{ ascending: false \}\);/,
  `const res2 = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "export_orders", action: "select", select: "id, order_number", order: { column: "created_at", options: { ascending: false } } }) }); const { data, error } = await res2.json();`
);

// 4. PackingListPreview.tsx
repl('src/pages/documents/PackingListPreview.tsx',
  /const \{ data: order, error \} = await vpsDb\s*\.from\("export_orders"\)\s*\.select\("\*, items:order_items\(\*, product:products\(\*\)\)"\)\s*\.eq\("id", id\)\s*\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "export_orders", action: "select", select: "*, items:order_items(*, product:products(*))", filters: [{ column: "id", type: "eq", value: id }], single: true }) }); const { data: order, error } = await res.json();`
);

// 5. Attendance.tsx
repl('src/pages/employees/Attendance.tsx',
  /const \{ data \} = await vpsDb\s*\.from\("attendance_logs"\)\s*\.select\("id, check_out"\)\s*\.eq\("user_id", session\?\.user\?\.id\)\s*\.order\("created_at", \{ ascending: false \}\)\s*\.limit\(1\)\s*\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "attendance_logs", action: "select", select: "id, check_out", filters: [{ column: "user_id", type: "eq", value: session?.user?.id }], order: { column: "created_at", options: { ascending: false } }, limit: 1, single: true }) }); const { data } = await res.json();`
);
repl('src/pages/employees/Attendance.tsx',
  /const \{ error \} = await vpsDb\s*\.from\("attendance_logs"\)\s*\.insert\(\[\s*\{\s*user_id: session\?\.user\?\.id,\s*check_in: new Date\(\)\.toISOString\(\),\s*status: 'Present'\s*\}\s*\]\);/,
  `const res2 = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "attendance_logs", action: "insert", data: [{ user_id: session?.user?.id, check_in: new Date().toISOString(), status: 'Present' }] }) }); const { error } = await res2.json();`
);
repl('src/pages/employees/Attendance.tsx',
  /const \{ error \} = await vpsDb\s*\.from\("attendance_logs"\)\s*\.update\(\{ check_out: new Date\(\)\.toISOString\(\) \}\)\s*\.eq\("id", lastLog\.id\);/,
  `const res3 = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "attendance_logs", action: "update", data: { check_out: new Date().toISOString() }, filters: [{ column: "id", type: "eq", value: lastLog.id }] }) }); const { error } = await res3.json();`
);

// 6. EmployeeDirectory.tsx
repl('src/pages/employees/EmployeeDirectory.tsx',
  /const \{ data: sessData \} = await \(vpsDb\s*\.from\("user_sessions"\)\s*\.select\("\*"\)\s*\.eq\("user_id", emp\.id\)\s*\.maybeSingle\(\)\);/,
  `const res = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "user_sessions", action: "select", select: "*", filters: [{ column: "user_id", type: "eq", value: emp.id }], single: true }) }); const { data: sessData } = await res.json();`
);
