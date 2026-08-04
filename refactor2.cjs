const fs = require('fs');

function replaceAll(path, search, replace) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
  console.log('Processed ' + path);
}

replaceAll('src/pages/barcodes/GenerateBarcode.tsx',
  /vpsDb[\s\S]*?\.from\("inventory_batches"\)[\s\S]*?\.limit\(30\)/,
  `fetch("/api/vps-fallback", {
          method: "POST",
          headers,
          body: JSON.stringify({
            table: "inventory_batches",
            action: "select",
            select: "id, lot_number, quantity_kg, product:products(name, sku)",
            order: { column: "created_at", options: { ascending: false } },
            limit: 30
          })
        }).then(r => r.json())`
);

replaceAll('src/pages/barcodes/GenerateBarcode.tsx',
  /const \{ data: existingBatch \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
  `const res1 = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table: "shipment_batches",
            action: "select",
            select: "id",
            filters: [{ column: "shipment_id", type: "eq", value: shipmentNumber }],
            single: true
          })
        });
        const { data: existingBatch } = await res1.json();`
);

replaceAll('src/pages/barcodes/GenerateBarcode.tsx',
  /const \{ data: newBatch, error: batchError \} = await vpsDb[\s\S]*?\.single\(\);/,
  `const res2 = await fetch("/api/vps-fallback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              table: "shipment_batches",
              action: "insert",
              data: [{
                shipment_id: shipmentNumber,
                shipment_uuid: selected.id,
                status: 'active',
                carton_number_total: totalCartons
              }]
            })
          });
          const { data: newBatchData, error: batchError } = await res2.json();
          const newBatch = Array.isArray(newBatchData) ? newBatchData[0] : newBatchData;`
);

// ScanBarcode.tsx
replaceAll('src/pages/barcodes/ScanBarcode.tsx',
  /const \{ data, error \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${session?.access_token}\` },
        body: JSON.stringify({
          table: "batch_barcodes",
          action: "select",
          select: "*",
          filters: [{ column: "code", type: "eq", value: code }],
          single: true
        })
      });
      const { data, error } = await res.json();`
);

replaceAll('src/pages/barcodes/ScanBarcode.tsx',
  /await vpsDb[\s\S]*?\.eq\("id", id\);/,
  `await fetch("/api/vps-fallback", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${session?.access_token}\` },
      body: JSON.stringify({
        table: "batch_barcodes",
        action: "update",
        data: { scan_count: (data.scan_count || 0) + 1, last_scanned_at: new Date().toISOString() },
        filters: [{ column: "id", type: "eq", value: id }]
      })
    });`
);

// Certificates.tsx
replaceAll('src/pages/documents/Certificates.tsx',
  /const \{ data, error \} = await vpsDb[\s\S]*?\.order\("created_at", \{ ascending: false \}\);/,
  `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${session?.access_token}\` },
          body: JSON.stringify({
            table: "export_certificates",
            action: "select",
            select: "*, shipment:export_shipments(shipment_number)",
            order: { column: "created_at", options: { ascending: false } }
          })
        });
        const { data, error } = await res.json();`
);

// CreateCertificate.tsx
replaceAll('src/pages/documents/CreateCertificate.tsx',
  /const \{ data, error \} = await vpsDb[\s\S]*?\.order\("created_at", \{ ascending: false \}\);/,
  `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${session?.access_token}\` },
          body: JSON.stringify({
            table: "export_shipments",
            action: "select",
            select: "id, shipment_number, destination_port",
            order: { column: "created_at", options: { ascending: false } }
          })
        });
        const { data, error } = await res.json();`
);

replaceAll('src/pages/documents/CreateCertificate.tsx',
  /const \{ error \} = await vpsDb[\s\S]*?\.insert\(\[\{[\s\S]*?\}\]\);/,
  `const res2 = await fetch("/api/vps-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${session?.access_token}\` },
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
      const { error } = await res2.json();`
);

// CreateInvoice.tsx
replaceAll('src/pages/documents/CreateInvoice.tsx',
  /const \{ error \} = await vpsDb[\s\S]*?\.insert\(\[\{[\s\S]*?\}\]\);/,
  `const res = await fetch("/api/vps-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${session?.access_token}\` },
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

// PackingListPreview.tsx
replaceAll('src/pages/documents/PackingListPreview.tsx',
  /const \{ data: order, error \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${session?.access_token}\` },
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

// CertificatePreview.tsx
replaceAll('src/pages/documents/CertificatePreview.tsx',
  /const \{ data, error \} = await vpsDb[\s\S]*?\.maybeSingle\(\);/,
  `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${session?.access_token}\` },
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

// Attendance.tsx
replaceAll('src/pages/employees/Attendance.tsx',
  /await vpsDb[\s\S]*?\.eq\("id", log\.id\);/,
  `await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${session?.access_token}\` },
          body: JSON.stringify({
            table: "attendance_logs",
            action: "update",
            data: { synced: true },
            filters: [{ column: "id", type: "eq", value: log.id }]
          })
        });`
);

// EmployeeDirectory.tsx
replaceAll('src/pages/employees/EmployeeDirectory.tsx',
  /const \{ data: sessData \} = await \(vpsDb[\s\S]*?\.maybeSingle\(\)\);/,
  `const res = await fetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${session?.access_token}\` },
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
