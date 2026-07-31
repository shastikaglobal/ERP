const fs = require('fs');

function replaceInFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  for (const rep of replacements) {
    const from = typeof rep.from === 'string' ? rep.from : rep.from;
    if (typeof rep.from === 'string') {
      content = content.replace(rep.from, rep.to);
    } else {
      content = content.replace(rep.from, rep.to);
    }
  }
  fs.writeFileSync(path, content, 'utf8');
}

// 1. ShipmentDetail.tsx
replaceInFile('src/pages/shipments/ShipmentDetail.tsx', [
  {
    from: /queryFn: async \(\) => \{\s*const data = null; const error = new Error\('Supabase removed'\);\s*if \(error\) throw error;\s*return data as Shipment;\s*\}/,
    to: `queryFn: async () => {
      const res = await fetch(\`/api/finance/export_shipments/\${id}\`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch shipment");
      const shipmentData = await res.json();
      if (shipmentData && shipmentData.order_id) {
        const orderRes = await fetch(\`/api/finance/export_orders/\${shipmentData.order_id}\`, { credentials: 'include' });
        if (orderRes.ok) {
          shipmentData.export_orders = await orderRes.json();
        }
      }
      return shipmentData as Shipment;
    }`
  },
  {
    from: /queryFn: async \(\) => \{\s*const data = null; const error = new Error\('Supabase removed'\);\s*if \(error\) throw error;\s*return \(data \?\? \[\]\) as Container\[\];\s*\}/,
    to: `queryFn: async () => {
      const res = await fetch(\`/api/finance/export_containers?shipment_id=\${id}\`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch containers");
      const data = await res.json();
      return (data ?? []) as Container[];
    }`
  },
  {
    from: /queryFn: async \(\) => \{\s*try \{\s*const data = null; const error = new Error\('Supabase removed'\);\s*if \(error\) return \[\];\s*return \(data \?\? \[\]\) as any\[\];\s*\} catch \{ return \[\]; \}\s*\}/,
    to: `queryFn: async () => {
      try {
        const res = await fetch(\`/api/barcodes?shipment_id=\${id}\`, { credentials: 'include' });
        if (!res.ok) return [];
        const data = await res.json();
        return (data ?? []) as any[];
      } catch { return []; }
    }`
  },
  {
    from: /queryFn: async \(\) => \{\s*try \{\s*const data = null; const error = new Error\('Supabase removed'\);\s*if \(error\) return \[\];\s*return \(data \?\? \[\]\) as ShipmentEvent\[\];\s*\} catch \{ return \[\]; \}\s*\}/,
    to: `queryFn: async () => {
      try {
        const res = await fetch(\`/api/shipments/events?shipment_id=\${id}\`, { credentials: 'include' });
        if (!res.ok) return [];
        const data = await res.json();
        return (data ?? []) as ShipmentEvent[];
      } catch { return []; }
    }`
  },
  {
    from: /mutationFn: async \(newStatus: string\) => \{\s*const error = new Error\('Supabase removed'\);\s*if \(error\) throw error;\s*\/\/[^\n]*\s*await fetch\(`\/api\/shipment_events`[^\}]+\}\);\s*\}/,
    to: `mutationFn: async (newStatus: string) => {
      const res = await fetch(\`/api/finance/export_shipments/\${id}\`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");

      await fetch(\`/api/shipments/events\`, { 
        method: 'POST', 
        credentials: 'include', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          shipment_id: id, 
          event_type: "status_change", 
          title: "Shipment status updated", 
          description: "Updated to " + newStatus,
          date: new Date().toISOString().split('T')[0] 
        }) 
      });
    }`
  },
  {
    from: /mutationFn: async \(\{ cid, status \}: \{ cid: string; status: string \}\) => \{\s*const error = new Error\('Supabase removed'\);\s*if \(error\) throw error;\s*\}/,
    to: `mutationFn: async ({ cid, status }: { cid: string; status: string }) => {
      const res = await fetch(\`/api/finance/export_containers/\${cid}\`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update container");
    }`
  },
  {
    from: /const \{ error \} = await fetch\(`\/api\/shipment_events`, \{ method: 'POST', credentials: 'include', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON\.stringify\(\{ shipment_id: id, event_type: "status_change", title: "Shipment status updated", description: "Updated to " \+ \(formData\?\.status \|\| "new status"\), location: formData\?\.vessel_name \|\| "", date: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\] \}\) \}\);/,
    to: `const res = await fetch(\`/api/shipments/events\`, { 
        method: 'POST', 
        credentials: 'include', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          shipment_id: shipmentId, 
          event_type: eventType, 
          title: title, 
          description: description, 
          location: location, 
          date: new Date().toISOString().split('T')[0] 
        }) 
      });
      if (!res.ok) throw new Error("Failed to log event");`
  },
  {
    from: /if \(error\) throw error;/g,
    to: `// if (error) throw error;`
  }
]);

// 2. ContainerTracking.tsx
replaceInFile('src/pages/shipments/ContainerTracking.tsx', [
  {
    from: /catch \(err: any\) \{\s*console\.error\("Containers API load failed, trying Supabase fallback\.\.\.", err\);\s*try \{\s*const data = null; const error = new Error\('Supabase removed'\);\s*if \(error\) throw error;\s*const formattedData = \(data \|\| \[\]\)\.map\(c => \(\{\s*dbId: c\.id,\s*id: c\.container_number,\s*shipmentId: c\.export_shipments\?\.shipment_number \|\| "Unknown",\s*type: c\.container_type,\s*weight: c\.weight_kg,\s*status: c\.status \|\| "Pending",\s*location: c\.export_shipments\?\.status === "Delivered"\s*\?\ c\.export_shipments\?\.destination_port\s*: c\.export_shipments\?\.status === "In Transit"\s*\? "At sea"\s*: c\.export_shipments\?\.origin_port \|\| "Unknown Location"\s*\}\)\);\s*setContainers\(formattedData\);\s*\} catch \(supErr: any\) \{\s*console\.error\("Supabase fallback error:", supErr\);\s*toast\.error\("Failed to load containers: " \+ \(supErr\.message \|\| supErr\)\);\s*\}\s*\}/,
    to: `catch (err: any) {
        console.error("Containers API load failed:", err);
        toast.error("Failed to load containers: " + (err.message || err));
      }`
  },
  {
    from: /if \(\!res\.ok\) \{\s*const error = new Error\('Supabase removed'\);\s*if \(error\) throw error;\s*\}/,
    to: `if (!res.ok) {
        throw new Error("Failed to update container");
      }`
  }
]);

// 3. DeliveryStatus.tsx
replaceInFile('src/pages/shipments/DeliveryStatus.tsx', [
  {
    from: /const data = null; const error = new Error\('Supabase removed'\);\s*if \(error\) throw error;\s*setShipments\(data \|\| \[\]\);/,
    to: `const res = await fetch('/api/finance/export_shipments', { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch shipments");
      const data = await res.json();
      setShipments(data || []);`
  }
]);
