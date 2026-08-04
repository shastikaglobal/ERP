const fs = require('fs');

function repl(path, search, replace) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
  console.log('Processed ' + path);
}

// 1. ScanBarcode.tsx
repl('src/pages/barcodes/ScanBarcode.tsx',
  /const \{ data, error \} = await vpsDb\s*\.from\("export_shipments"\)\s*\.select\("id, shipment_number, destination_port, status"\)\s*\.neq\("status", "Delivered"\)/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_shipments", action: "select",
          select: "id, shipment_number, destination_port, status",
          filters: [{ column: "status", type: "neq", value: "Delivered" }]
        })
      });
      const { data, error } = await res.json();`
);
repl('src/pages/barcodes/ScanBarcode.tsx',
  /const \{ data, error \} = await vpsDb\s*\.from\("export_containers"\)\s*\.select\("id, container_number, container_type"\)\s*\.eq\("shipment_id", shipmentId\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_containers", action: "select",
          select: "id, container_number, container_type",
          filters: [{ column: "shipment_id", type: "eq", value: shipmentId }]
        })
      });
      const { data, error } = await res.json();`
);
repl('src/pages/barcodes/ScanBarcode.tsx',
  /const \{ data, error \} = await vpsDb\s*\.from\('batch_barcodes'\)\s*\.select\('\*'\)\s*\.eq\('code', raw\)/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "batch_barcodes", action: "select", select: "*",
          filters: [{ column: "code", type: "eq", value: raw }]
        })
      });
      const { data, error } = await res.json();`
);

// 2. CertificatePreview.tsx
repl('src/pages/documents/CertificatePreview.tsx',
  /const \{ data, error \} = await vpsDb\s*\.from\("export_certificates"\)\s*\.select\("\*, shipment:export_shipments\(\*\)"\)\s*\.eq\("id", id\)\s*\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_certificates", action: "select", select: "*, shipment:export_shipments(*)",
          filters: [{ column: "id", type: "eq", value: id }], single: true
        })
      });
      const { data, error } = await res.json();`
);

// 3. Certificates.tsx
repl('src/pages/documents/Certificates.tsx',
  /const \{ data, error \} = await vpsDb\s*\.from\("export_certificates"\)\s*\.select\("\*, shipment:export_shipments\(shipment_number\)"\)\s*\.order\("created_at", \{ ascending: false \}\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_certificates", action: "select", select: "*, shipment:export_shipments(shipment_number)",
          order: { column: "created_at", options: { ascending: false } }
        })
      });
      const { data, error } = await res.json();`
);

// 4. CreateCertificate.tsx
repl('src/pages/documents/CreateCertificate.tsx',
  /const \{ data, error \} = await vpsDb\s*\.from\("export_shipments"\)\s*\.select\("id, shipment_number, destination_port"\)\s*\.order\("created_at", \{ ascending: false \}\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_shipments", action: "select", select: "id, shipment_number, destination_port",
          order: { column: "created_at", options: { ascending: false } }
        })
      });
      const { data, error } = await res.json();`
);
repl('src/pages/documents/CreateCertificate.tsx',
  /const \{ error \} = await vpsDb\s*\.from\("export_certificates"\)\s*\.insert\([\s\S]*?\);/,
  `const res2 = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_certificates", action: "insert",
          data: [{ shipment_id: data.shipmentId, type: data.type, authority: data.authority, status: "Pending", notes: data.notes }]
        })
      });
      const { error } = await res2.json();`
);

// 5. CreateInvoice.tsx
repl('src/pages/documents/CreateInvoice.tsx',
  /const \{ error \} = await vpsDb\s*\.from\("commercial_invoices"\)\s*\.insert\([\s\S]*?\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "commercial_invoices", action: "insert",
          data: [{ shipment_id: payload.shipmentId || null, order_id: payload.orderId || null, total_amount: Number(payload.totalAmount), currency: payload.currency, status: "Draft", issue_date: payload.issueDate }]
        })
      });
      const { error } = await res.json();`
);

// 6. PackingListPreview.tsx
repl('src/pages/documents/PackingListPreview.tsx',
  /const \{ data: order, error \} = await vpsDb\s*\.from\("export_orders"\)\s*\.select\("\*, items:order_items\(\*, product:products\(\*\)\)"\)\s*\.eq\("id", id\)\s*\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_orders", action: "select", select: "*, items:order_items(*, product:products(*))",
          filters: [{ column: "id", type: "eq", value: id }], single: true
        })
      });
      const { data: order, error } = await res.json();`
);

// 7. Attendance.tsx
repl('src/pages/employees/Attendance.tsx',
  /await vpsDb\s*\.from\("attendance_logs"\)\s*\.update\(\{ synced: true \}\)\s*\.eq\("id", log\.id\);/g,
  `await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ table: "attendance_logs", action: "update", data: { synced: true }, filters: [{ column: "id", type: "eq", value: log.id }] })
      });`
);

// 8. EmployeeDirectory.tsx
repl('src/pages/employees/EmployeeDirectory.tsx',
  /const \{ data: sessData \} = await \(vpsDb\s*\.from\("user_sessions"\)\s*\.select\("\*"\)\s*\.eq\("user_id", emp\.id\)\s*\.maybeSingle\(\)\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ table: "user_sessions", action: "select", select: "*", filters: [{ column: "user_id", type: "eq", value: emp.id }], single: true })
      });
      const { data: sessData } = await res.json();`
);
