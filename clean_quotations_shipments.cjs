const fs = require('fs');

function replaceInFile(filePath, searchRegex, replaceStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchRegex, replaceStr);
  fs.writeFileSync(filePath, content, 'utf8');
}

// ----------------------------------------------------
// Quotations
// ----------------------------------------------------
const createQuotationPath = 'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\quotations\\CreateQuotation.tsx';
let createQuotationContent = fs.readFileSync(createQuotationPath, 'utf8');

// Replace fallback block for leads
createQuotationContent = createQuotationContent.replace(
  /\/\/ If backend returned 401[\s\S]*?if \(supRes\.error\) console\.error\('Supabase leads error:', supRes\.error\);[\s\S]*?console\.error\('Fallback supabase fetch failed:', e\);\s*\}/g,
  `// Fallback disabled.`
);

createQuotationContent = createQuotationContent.replace(
  /const \{ data \} = await supabase\.from\('packaging_types'\)\.select\('name'\)\.order\('name'\);/g,
  `const res = await fetch('/api/settings/packaging_types', { credentials: 'include' });
    const data = await res.json().catch(() => null);`
);

createQuotationContent = createQuotationContent.replace(
  /const \{ error \} = await supabase\.from\("packaging_types"\)\.insert\(\{ name: newPkgName \}\);/g,
  `const res = await fetch('/api/settings/packaging_types', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newPkgName }) });
      const error = res.ok ? null : new Error('Failed');`
);

createQuotationContent = createQuotationContent.replace(
  /await supabase\.from\("leads"\)\.update\(\{ stage: "negotiation" \}\)\.eq\("id", selectedLeadId\);/g,
  `await fetch(\`/api/crm/leads/\${selectedLeadId}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: "negotiation" }) });`
);

// Delete import supabase
createQuotationContent = createQuotationContent.replace(/import \{ supabase \} from "@\/integrations\/supabase\/client";\n?/g, '');
fs.writeFileSync(createQuotationPath, createQuotationContent, 'utf8');

const editQuotationPath = 'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\quotations\\EditQuotation.tsx';
let editQuotationContent = fs.readFileSync(editQuotationPath, 'utf8');

// EditQuotation has Promise.all for container_types and packaging_types
editQuotationContent = editQuotationContent.replace(
  /const leadsQuery = supabase\.from\('leads'\)\.select\('\*'\)\.order\('created_at', \{ ascending: false \}\);\s*let productsQuery = supabase\.from\('products'\)\.select\('\*'\);/g,
  `const leadsQuery = fetch('/api/crm/leads', { credentials: 'include' }).then(r => r.json());
        let productsQuery = fetch('/api/products', { credentials: 'include' }).then(r => r.json());`
);

editQuotationContent = editQuotationContent.replace(
  /supabase\.from\('container_types'\)\.select\('name'\)\.order\('name'\),/g,
  `fetch('/api/settings/container_types', { credentials: 'include' }).then(r => r.json()).then(data => ({ data })),`
);
editQuotationContent = editQuotationContent.replace(
  /supabase\.from\('packaging_types'\)\.select\('name'\)\.order\('name'\)/g,
  `fetch('/api/settings/packaging_types', { credentials: 'include' }).then(r => r.json()).then(data => ({ data }))`
);

editQuotationContent = editQuotationContent.replace(
  /const \{ data \} = await supabase\.from\('packaging_types'\)\.select\('name'\)\.order\('name'\);/g,
  `const res = await fetch('/api/settings/packaging_types', { credentials: 'include' });
    const data = await res.json().catch(() => null);`
);

editQuotationContent = editQuotationContent.replace(
  /const \{ error \} = await supabase\.from\("packaging_types"\)\.insert\(\{ name: newPkgName \}\);/g,
  `const res = await fetch('/api/settings/packaging_types', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newPkgName }) });
      const error = res.ok ? null : new Error('Failed');`
);

editQuotationContent = editQuotationContent.replace(
  /const \{ data: existingCust \} = await supabase[\s\S]*?\.single\(\);/g,
  `const existingCustRes = await fetch(\`/api/customers?lead_id=\${quotationData.lead_id}\`, { credentials: 'include' });
      const existingCustArr = await existingCustRes.json().catch(() => []);
      const existingCust = existingCustArr[0];`
);

editQuotationContent = editQuotationContent.replace(
  /await supabase[\s\S]*?\.eq\("id", existingCust\.id\);/g,
  `await fetch(\`/api/customers/\${existingCust.id}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_name: "Customer Name", contact_person: "Contact Name", email: "Email", phone: "Phone" }) });`
);

editQuotationContent = editQuotationContent.replace(
  /const \{ data: custData, error: custErr \} = await supabase[\s\S]*?\.select\(\)[\s\S]*?\.single\(\);/g,
  `const custRes = await fetch('/api/customers', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_name: "Customer Name", contact_person: "Contact Name", email: "Email", phone: "Phone", lead_id: quotationData.lead_id, company_id: profile?.company_id }) });
        const custData = await custRes.json().catch(() => null);
        const custErr = custRes.ok ? null : new Error('Failed');`
);

editQuotationContent = editQuotationContent.replace(/import \{ supabase \} from "@\/integrations\/supabase\/client";\n?/g, '');
fs.writeFileSync(editQuotationPath, editQuotationContent, 'utf8');

// ----------------------------------------------------
// Shipments
// ----------------------------------------------------
const shipmentDetailPath = 'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\shipments\\ShipmentDetail.tsx';
let shipmentDetailContent = fs.readFileSync(shipmentDetailPath, 'utf8');

shipmentDetailContent = shipmentDetailContent.replace(
  /const \{ data, error \} = await supabase\s*\.from\("export_shipments"\)\s*\.update\(\{[\s\S]*?\}\)\s*\.eq\("id", id\)\s*\.select\(\)\s*\.single\(\);/g,
  `const res = await fetch(\`/api/shipments/\${id}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actual_departure: formData.actual_departure, estimated_arrival: formData.estimated_arrival, vessel_name: formData.vessel_name, status: formData.status }) });
      const data = await res.json().catch(() => null);
      const error = res.ok ? null : new Error('Failed');`
);

shipmentDetailContent = shipmentDetailContent.replace(
  /const \{ data, error \} = await supabase\s*\.from\("export_shipments"\)\s*\.update\(\{ status: "departed" \}\)\s*\.eq\("id", id\)\s*\.select\(\)\s*\.single\(\);/g,
  `const res = await fetch(\`/api/shipments/\${id}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: "departed" }) });
      const data = await res.json().catch(() => null);
      const error = res.ok ? null : new Error('Failed');`
);

shipmentDetailContent = shipmentDetailContent.replace(
  /const \{ data, error \} = await supabase\s*\.from\("export_shipments"\)\s*\.update\(\{ status: "arrived" \}\)\s*\.eq\("id", id\)\s*\.select\(\)\s*\.single\(\);/g,
  `const res = await fetch(\`/api/shipments/\${id}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: "arrived" }) });
        const data = await res.json().catch(() => null);
        const error = res.ok ? null : new Error('Failed');`
);

shipmentDetailContent = shipmentDetailContent.replace(
  /const \{ data, error \} = await supabase\s*\.from\("export_shipments"\)\s*\.update\(\{ status: "delivered" \}\)\s*\.eq\("id", id\)\s*\.select\(\)\s*\.single\(\);/g,
  `const res = await fetch(\`/api/shipments/\${id}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: "delivered" }) });
        const data = await res.json().catch(() => null);
        const error = res.ok ? null : new Error('Failed');`
);

shipmentDetailContent = shipmentDetailContent.replace(
  /const \{ error \} = await supabase\s*\.from\("commercial_invoices"\)\s*\.update\(\{ payment_status: "paid" \}\)\s*\.eq\("shipment_id", id\);/g,
  `const res = await fetch(\`/api/invoices/shipment/\${id}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_status: "paid" }) });
      const error = res.ok ? null : new Error('Failed');`
);

shipmentDetailContent = shipmentDetailContent.replace(
  /await supabase\.from\("shipment_events"\)\.insert\(\{[\s\S]*?\}\);/g,
  `await fetch(\`/api/shipment_events\`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shipment_id: id, event_type: "status_change", title: "Shipment status updated", description: "Updated to " + (formData?.status || "new status"), location: formData?.vessel_name || "", date: new Date().toISOString().split('T')[0] }) });`
);

shipmentDetailContent = shipmentDetailContent.replace(
  /const \{ error \} = await supabase\s*\.from\("tasks"\)\s*\.update\(\{ status: "completed" \}\)\s*\.eq\("id", taskId\);/g,
  `const res = await fetch(\`/api/tasks/\${taskId}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: "completed" }) });
      const error = res.ok ? null : new Error('Failed');`
);

shipmentDetailContent = shipmentDetailContent.replace(/import \{ supabase \} from "@\/integrations\/supabase\/client";\n?/g, '');
fs.writeFileSync(shipmentDetailPath, shipmentDetailContent, 'utf8');

const deliveryStatusPath = 'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\shipments\\DeliveryStatus.tsx';
let deliveryStatusContent = fs.readFileSync(deliveryStatusPath, 'utf8');

deliveryStatusContent = deliveryStatusContent.replace(
  /const \{ data, error \} = await supabase\s*\.from\("export_shipments"\)\s*\.select\("id, shipment_number, port_of_discharge, estimated_arrival, status"\)\s*\.eq\("is_deleted", false\)\s*\.in\("status", \["departed", "arrived", "customs_cleared"\]\)\s*\.order\("estimated_arrival", \{ ascending: true \}\);/g,
  `const res = await fetch('/api/shipments?status=active_delivery', { credentials: 'include' });
      const data = await res.json().catch(() => null);
      const error = res.ok ? null : new Error('Failed');`
);

deliveryStatusContent = deliveryStatusContent.replace(
  /const \{ error \} = await supabase\.from\("export_shipments"\)\.update\(\{ status: newStatus \}\)\.eq\("id", id\);/g,
  `const res = await fetch(\`/api/shipments/\${id}\`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      const error = res.ok ? null : new Error('Failed');`
);

deliveryStatusContent = deliveryStatusContent.replace(/import \{ supabase \} from "@\/integrations\/supabase\/client";\n?/g, '');
fs.writeFileSync(deliveryStatusPath, deliveryStatusContent, 'utf8');

const createShipmentPath = 'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\shipments\\CreateShipment.tsx';
let createShipmentContent = fs.readFileSync(createShipmentPath, 'utf8');

createShipmentContent = createShipmentContent.replace(
  /const \{ error: barcodeError \} = await supabase\.from\('batch_barcodes'\)\.insert\(\{[\s\S]*?\}\);/g,
  `const bRes = await fetch('/api/barcodes', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batch_number: b.batch_number, barcode_data: b.batch_number, created_by: profile?.id }) });
      const barcodeError = bRes.ok ? null : new Error('Failed');`
);

createShipmentContent = createShipmentContent.replace(/import \{ supabase \} from "@\/integrations\/supabase\/client";\n?/g, '');
fs.writeFileSync(createShipmentPath, createShipmentContent, 'utf8');

const containerTrackingPath = 'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\shipments\\ContainerTracking.tsx';
let containerTrackingContent = fs.readFileSync(containerTrackingPath, 'utf8');

containerTrackingContent = containerTrackingContent.replace(
  /console\.error\("Containers API load failed, trying Supabase fallback\.\.\.", err\);[\s\S]*?console\.error\("Supabase fallback error:", supErr\);\s*\}/g,
  `console.error("Containers API load failed", err);`
);

containerTrackingContent = containerTrackingContent.replace(
  /\/\/ Fallback to direct supabase update[\s\S]*?const \{ error \} = await supabase[\s\S]*?\.eq\("id", containerId\);/g,
  `// Fallback disabled`
);

containerTrackingContent = containerTrackingContent.replace(/import \{ supabase \} from "@\/integrations\/supabase\/client";\n?/g, '');
fs.writeFileSync(containerTrackingPath, containerTrackingContent, 'utf8');

console.log("Quotations and Shipments Fallback cleanups done");
