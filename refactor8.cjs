const fs = require('fs');

function fixScanBarcode() {
  const file = 'src/pages/barcodes/ScanBarcode.tsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /const \{ data, error \} = await vpsDb\s*\n\s*\.from\("export_shipments"\)\s*\n\s*\.select\("id, shipment_number, destination_port, status"\)\s*\n\s*\.neq\("status", "Delivered"\)\s*\n\s*\.order\("created_at", \{ ascending: false \}\)\s*\n\s*\.limit\(50\);/g,
    `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "export_shipments", action: "select",
          select: "id, shipment_number, destination_port, status",
          filters: [{ column: "status", type: "neq", value: "Delivered" }],
          order: { column: "created_at", options: { ascending: false } },
          limit: 50
        })
      });
      const { data, error } = await res.json();`
  );

  content = content.replace(
    /const \{ data, error \} = await vpsDb\s*\n\s*\.from\("export_containers"\)\s*\n\s*\.select\("id, container_number, container_type"\)\s*\n\s*\.eq\("shipment_id", shipmentId\);/g,
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

  content = content.replace(
    /const \{ data, error \} = await vpsDb\s*\n\s*\.from\('batch_barcodes'\)\s*\n\s*\.select\('\*'\)\s*\n\s*\.eq\('code', raw\)\s*\n\s*\.single\(\);/g,
    `const res = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "batch_barcodes", action: "select", select: "*",
          filters: [{ column: "code", type: "eq", value: raw }], single: true
        })
      });
      const { data, error } = await res.json();`
  );

  content = content.replace(
    /await vpsDb\.from\('batch_barcodes'\)\.update\(updates\)\.eq\('id', data\.id\);/g,
    `await fetch("/api/vps-fallback", {
           method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
           body: JSON.stringify({
             table: "batch_barcodes", action: "update", data: updates,
             filters: [{ column: "id", type: "eq", value: data.id }]
           })
         });`
  );
  
  content = content.replace(/import \{ vpsDb \} from "@\/lib\/vpsDb";\n?/g, '');

  fs.writeFileSync(file, content);
  console.log('Fixed ScanBarcode.tsx');
}

function fixGenerateBarcode() {
  const file = 'src/pages/barcodes/GenerateBarcode.tsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /const \{ data: prof \} = await vpsDb\.from\("profiles"\)\.select\("company_id"\)\.maybeSingle\(\);/g,
    `const profRes = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "profiles", action: "select", select: "company_id", single: true
        })
      });
      const { data: prof } = await profRes.json();`
  );

  content = content.replace(
    /const \{ data: cos \} = await vpsDb\.from\("companies"\)\.select\("id"\)\.limit\(1\);/g,
    `const cosRes = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          table: "companies", action: "select", select: "id", limit: 1
        })
      });
      const { data: cos } = await cosRes.json();`
  );
  
  content = content.replace(
    /vpsDb\s*\n\s*\.from\("inventory_batches"\)\s*\n\s*\.select\("id, lot_number, quantity_kg, product:products\(name, sku\)"\)\s*\n\s*\.order\("created_at", \{ ascending: false \}\)\.limit\(30\),/g,
    `fetch("/api/vps-fallback", {
          method: "POST", headers,
          body: JSON.stringify({
            table: "inventory_batches", action: "select",
            select: "id, lot_number, quantity_kg, product:products(name, sku)",
            order: { column: "created_at", options: { ascending: false } }, limit: 30
          })
        }).then(r => r.json()),`
  );

  content = content.replace(
    /vpsDb\.from\("batch_barcodes"\)\.select\("shipment_id, batch_id"\),/g,
    `fetch("/api/vps-fallback", {
          method: "POST", headers,
          body: JSON.stringify({ table: "batch_barcodes", action: "select", select: "shipment_id, batch_id" })
        }).then(r => r.json()),`
  );
  
  content = content.replace(
    /const \{ data: existingBatch \} = await vpsDb\s*\n\s*\.from\("shipment_batches"\)\s*\n\s*\.select\("id"\)\s*\n\s*\.eq\("shipment_id", shipmentNumber\)\s*\n\s*\.maybeSingle\(\);/g,
    `const resEB = await fetch("/api/vps-fallback", {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({
            table: "shipment_batches", action: "select", select: "id",
            filters: [{ column: "shipment_id", type: "eq", value: shipmentNumber }], single: true
          })
        });
        const { data: existingBatch } = await resEB.json();`
  );

  content = content.replace(
    /const \{ data: newBatch, error: batchError \} = await vpsDb\s*\n\s*\.from\("shipment_batches"\)\s*\n\s*\.insert\(\{\s*\n\s*shipment_id: shipmentNumber,\s*\n\s*shipment_uuid: selected\.id,\s*\n\s*status: 'active',\s*\n\s*carton_number_total: totalCartons\s*\n\s*\}\)\s*\n\s*\.select\("id"\)\s*\n\s*\.single\(\);/g,
    `const resNB = await fetch("/api/vps-fallback", {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({
              table: "shipment_batches", action: "insert",
              data: [{ shipment_id: shipmentNumber, shipment_uuid: selected.id, status: 'active', carton_number_total: totalCartons }]
            })
          });
          const { data: newBatchList, error: batchError } = await resNB.json();
          const newBatch = Array.isArray(newBatchList) ? newBatchList[0] : newBatchList;`
  );

  content = content.replace(
    /const \{ error: barcodeError \} = await vpsDb\.from\("batch_barcodes"\)\.insert\(rows\);/g,
    `const resBC = await fetch("/api/vps-fallback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ table: "batch_barcodes", action: "insert", data: rows })
      });
      const { error: barcodeError } = await resBC.json();`
  );

  content = content.replace(/import \{ vpsDb \} from "@\/lib\/vpsDb";\n?/g, '');

  fs.writeFileSync(file, content);
  console.log('Fixed GenerateBarcode.tsx');
}

fixScanBarcode();
fixGenerateBarcode();
