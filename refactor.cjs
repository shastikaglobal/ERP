const fs = require('fs');

function processFile(path, replacer) {
  if (!fs.existsSync(path)) {
    console.log('Skipping ' + path);
    return;
  }
  let content = fs.readFileSync(path, 'utf8');
  content = replacer(content);
  fs.writeFileSync(path, content);
  console.log('Processed ' + path);
}

// 1. BarcodesList.tsx
processFile('src/pages/barcodes/BarcodesList.tsx', c => {
  return c.replace(/const \{ data, error \} = await vpsDb[\s\S]*?\.order\("created_at", \{ ascending: false \}\);/, 
    `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "batch_barcodes",
            action: "select",
            select: "id, code, level, box_number, current_location, status, scan_count, last_scanned_at, created_at, batch:inventory_batches(lot_number, grade, product:products(name), farmer:farmers(full_name)), shipment:export_shipments(id, shipment_number, destination_port, status), order:export_orders(id, order_number, destination, status)",
            order: { column: "created_at", options: { ascending: false } }
          })
        });
        const { data, error } = await res.json();`
  );
});

// 2. BarcodeDetail.tsx
processFile('src/pages/barcodes/BarcodeDetail.tsx', c => {
  return c.replace(/const \{ data, error \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
    `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "batch_barcodes",
            action: "select",
            select: "*, batch:inventory_batches(*, product:products(*), farmer:farmers(*))",
            filters: [{ column: "id", type: "eq", value: id }],
            single: true
          })
        });
        const { data, error } = await res.json();`
  ).replace(/const \{ error \} = await vpsDb[\s\S]*?\.eq\("id", id\);/, 
    `const res = await fetch("/api/vps-fallback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        table: "batch_barcodes",
        action: "update",
        data: updates,
        filters: [{ column: "id", type: "eq", value: id }]
      })
    });
    const { error } = await res.json();`
  ).replace(/const \{ error \} = await vpsDb[\s\S]*?\.eq\("id", id\);/,
    `const res = await fetch("/api/vps-fallback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        table: "batch_barcodes",
        action: "delete",
        filters: [{ column: "id", type: "eq", value: id }]
      })
    });
    const { error } = await res.json();`
  );
});

// 3. GenerateBarcode.tsx
processFile('src/pages/barcodes/GenerateBarcode.tsx', c => {
  let nc = c.replace(/const \{ data, error \} = await vpsDb[\s\S]*?\.order\("created_at", \{ ascending: false \}\);/,
    `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "inventory_batches",
            action: "select",
            select: "id, lot_number, grade, product:products(name)",
            order: { column: "created_at", options: { ascending: false } }
          })
        });
        const { data, error } = await res.json();`
  );
  nc = nc.replace(/const \{ error \} = await vpsDb[\s\S]*?\.insert\(barcodes\);/,
    `const res = await fetch("/api/vps-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          table: "batch_barcodes",
          action: "insert",
          data: barcodes
        })
      });
      const { error } = await res.json();`
  );
  return nc;
});

// 4. ScanBarcode.tsx
processFile('src/pages/barcodes/ScanBarcode.tsx', c => {
  return c.replace(/const \{ data, error \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
    `const res = await fetch("/api/vps-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          table: "batch_barcodes",
          action: "select",
          select: "*",
          filters: [{ column: "code", type: "eq", value: code }],
          single: true
        })
      });
      const { data, error } = await res.json();`
  ).replace(/await vpsDb[\s\S]*?\.eq\("id", id\);/,
    `await fetch("/api/vps-fallback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        table: "batch_barcodes",
        action: "update",
        data: { scan_count: (data.scan_count || 0) + 1, last_scanned_at: new Date().toISOString() },
        filters: [{ column: "id", type: "eq", value: id }]
      })
    });`
  );
});

// 5. Certificates.tsx
processFile('src/pages/documents/Certificates.tsx', c => {
  return c.replace(/const \{ data, error \} = await vpsDb[\s\S]*?\.order\("created_at", \{ ascending: false \}\);/,
    `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "export_certificates",
            action: "select",
            select: "*, shipment:export_shipments(shipment_number)",
            order: { column: "created_at", options: { ascending: false } }
          })
        });
        const { data, error } = await res.json();`
  );
});

// 6. CreateCertificate.tsx
processFile('src/pages/documents/CreateCertificate.tsx', c => {
  return c.replace(/const \{ data, error \} = await vpsDb[\s\S]*?\.order\("created_at", \{ ascending: false \}\);/,
    `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "export_shipments",
            action: "select",
            select: "id, shipment_number, destination_port",
            order: { column: "created_at", options: { ascending: false } }
          })
        });
        const { data, error } = await res.json();`
  ).replace(/const \{ error \} = await vpsDb[\s\S]*?\.insert\(\[\{[\s\S]*?\}\]\);/,
    `const res = await fetch("/api/vps-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          table: "export_certificates",
          action: "insert",
          data: [{
            shipment_id: data.shipmentId,
            type: data.type,
            authority: data.authority,
            status: "Pending",
            notes: data.notes
          }]
        })
      });
      const { error } = await res.json();`
  );
});

// 7. CreateInvoice.tsx
processFile('src/pages/documents/CreateInvoice.tsx', c => {
  return c.replace(/const \{ error \} = await vpsDb[\s\S]*?\.insert\(\[\{[\s\S]*?\}\]\);/,
    `const res = await fetch("/api/vps-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          table: "commercial_invoices",
          action: "insert",
          data: [{
            shipment_id: payload.shipmentId || null,
            order_id: payload.orderId || null,
            total_amount: Number(payload.totalAmount),
            currency: payload.currency,
            status: "Draft",
            issue_date: payload.issueDate
          }]
        })
      });
      const { error } = await res.json();`
  );
});

// 8. InvoiceReport.tsx
processFile('src/pages/documents/InvoiceReport.tsx', c => {
  return c.replace(/let \{ data, error \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
    `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "export_shipments",
            action: "select",
            select: "*, export_orders(*)",
            filters: [{ column: "id", type: "eq", value: id }],
            single: true
          })
        });
        let { data, error } = await res.json();`
  ).replace(/const \{ data: orderOnly, error: orderErr \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
    `const res2 = await fetch("/api/vps-fallback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              table: "export_orders",
              action: "select",
              select: "*, export_shipments(*)",
              filters: [{ column: "id", type: "eq", value: id }],
              single: true
            })
          });
          const { data: orderOnly, error: orderErr } = await res2.json();`
  );
});

// 9. CertificatePreview.tsx
processFile('src/pages/documents/CertificatePreview.tsx', c => {
  return c.replace(/const \{ data, error \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
    `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "export_certificates",
            action: "select",
            select: "*, shipment:export_shipments(*)",
            filters: [{ column: "id", type: "eq", value: id }],
            single: true
          })
        });
        const { data, error } = await res.json();`
  );
});

// 10. PackingListPreview.tsx
processFile('src/pages/documents/PackingListPreview.tsx', c => {
  return c.replace(/const \{ data: order, error \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
    `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "export_orders",
            action: "select",
            select: "*, items:order_items(*, product:products(*))",
            filters: [{ column: "id", type: "eq", value: id }],
            single: true
          })
        });
        const { data: order, error } = await res.json();`
  );
});

// 11. Attendance.tsx
processFile('src/pages/employees/Attendance.tsx', c => {
  let nc = c.replace(/await vpsDb[\s\S]*?\.eq\("id", log\.id\);/g,
    `await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "attendance_logs",
            action: "update",
            data: { synced: true },
            filters: [{ column: "id", type: "eq", value: log.id }]
          })
        });`
  );
  return nc;
});

// 12. EmployeeDirectory.tsx
processFile('src/pages/employees/EmployeeDirectory.tsx', c => {
  return c.replace(/const \{ data: sessData \} = await \(vpsDb[\s\S]*?\.maybeSingle\(\)\);/,
    `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "user_sessions",
            action: "select",
            select: "*",
            filters: [{ column: "user_id", type: "eq", value: emp.id }],
            single: true
          })
        });
        const { data: sessData } = await res.json();`
  );
});
