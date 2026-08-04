const fs = require('fs');

function repl(path, search, replace) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
  console.log('Processed ' + path);
}

// 1. PackingListPreview.tsx
repl('src/pages/documents/PackingListPreview.tsx',
  /const \{ data: order, error \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_orders", action: "select", select: "*, items:order_items(*, product:products(*))",
          filters: [{ column: "id", type: "eq", value: id }], single: true
        })
      });
      const { data: order, error } = await res.json();`
);

// 2. CreateInvoice.tsx
repl('src/pages/documents/CreateInvoice.tsx',
  /const \{ data, error \} = await vpsDb[\s\S]*?\.order\("created_at", \{ ascending: false \}\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_shipments", action: "select", select: "id, shipment_number",
          order: { column: "created_at", options: { ascending: false } }
        })
      });
      const { data, error } = await res.json();`
);
repl('src/pages/documents/CreateInvoice.tsx',
  /const \{ data, error \} = await vpsDb[\s\S]*?\.order\("created_at", \{ ascending: false \}\);/,
  `const res2 = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_orders", action: "select", select: "id, order_number",
          order: { column: "created_at", options: { ascending: false } }
        })
      });
      const { data, error } = await res2.json();`
);

// 3. CreateCertificate.tsx
repl('src/pages/documents/CreateCertificate.tsx',
  /const \{ data: compData \} = await vpsDb[\s\S]*?\.single\(\);/,
  `const resComp = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "companies", action: "select", select: "id",
          filters: [{ column: "id", type: "eq", value: companyId }], single: true
        })
      });
      const { data: compData } = await resComp.json();`
);

// 4. Certificates.tsx
repl('src/pages/documents/Certificates.tsx',
  /const \{ data: vpsDbData, error \} = await vpsDb[\s\S]*?\.order\("created_at", \{ ascending: false \}\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_certificates", action: "select", select: "*, shipment:export_shipments(shipment_number)",
          order: { column: "created_at", options: { ascending: false } }
        })
      });
      const { data: vpsDbData, error } = await res.json();`
);
repl('src/pages/documents/Certificates.tsx',
  /const \{ error \} = await vpsDb[\s\S]*?\.eq\("id", id\);/,
  `const resDel = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_certificates", action: "delete",
          filters: [{ column: "id", type: "eq", value: id }]
        })
      });
      const { error } = await resDel.json();`
);

// 5. CertificatePreview.tsx
repl('src/pages/documents/CertificatePreview.tsx',
  /const \{ data: shipmentData, error: shipErr \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_shipments", action: "select", select: "*, export_orders(*)",
          filters: [{ column: "id", type: "eq", value: id }], single: true
        })
      });
      const { data: shipmentData, error: shipErr } = await res.json();`
);
repl('src/pages/documents/CertificatePreview.tsx',
  /const \{ data: orderOnly, error: orderErr \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
  `const resOrd = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_orders", action: "select", select: "*, export_shipments(*)",
          filters: [{ column: "id", type: "eq", value: id }], single: true
        })
      });
      const { data: orderOnly, error: orderErr } = await resOrd.json();`
);
repl('src/pages/documents/CertificatePreview.tsx',
  /const \{ data: compData \} = await vpsDb[\s\S]*?\.single\(\);/,
  `const resComp = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "companies", action: "select", select: "*",
          filters: [{ column: "id", type: "eq", value: companyId }], single: true
        })
      });
      const { data: compData } = await resComp.json();`
);
repl('src/pages/documents/CertificatePreview.tsx',
  /const \{ data: userData \} = await vpsDb[\s\S]*?\.single\(\);/,
  `const resUser = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "profiles", action: "select", select: "*",
          filters: [{ column: "id", type: "eq", value: session?.user?.id }], single: true
        })
      });
      const { data: userData } = await resUser.json();`
);

// 6. Attendance.tsx
repl('src/pages/employees/Attendance.tsx',
  /const \{ data \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "attendance_logs", action: "select", select: "id, check_out",
          filters: [{ column: "user_id", type: "eq", value: session?.user?.id }],
          order: { column: "created_at", options: { ascending: false } },
          limit: 1, single: true
        })
      });
      const { data } = await res.json();`
);
repl('src/pages/employees/Attendance.tsx',
  /const \{ error \} = await vpsDb[\s\S]*?\.insert\(\[\{[\s\S]*?\}\]\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "attendance_logs", action: "insert",
          data: [{ user_id: session?.user?.id, check_in: new Date().toISOString(), status: 'Present' }]
        })
      });
      const { error } = await res.json();`
);
repl('src/pages/employees/Attendance.tsx',
  /const \{ error \} = await vpsDb[\s\S]*?\.eq\("id", lastLog\.id\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "attendance_logs", action: "update",
          data: { check_out: new Date().toISOString() },
          filters: [{ column: "id", type: "eq", value: lastLog.id }]
        })
      });
      const { error } = await res.json();`
);

// 7. EmployeeDirectory.tsx
repl('src/pages/employees/EmployeeDirectory.tsx',
  /const \{ data: sessData \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({
            table: "user_sessions", action: "select", select: "*",
            filters: [{ column: "user_id", type: "eq", value: emp.id }], single: true
          })
        });
        const { data: sessData } = await res.json();`
);
