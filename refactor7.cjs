const fs = require('fs');

function repl(path, search, replace) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
  console.log('Processed ' + path);
}

// 1. CreateInvoice.tsx
repl('src/pages/documents/CreateInvoice.tsx',
  `          const { data, error } = await vpsDb
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });`,
  `          const res = await fetch("/api/vps-fallback", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              table: "leads", action: "select", select: "*", order: { column: "created_at", options: { ascending: false } }
            })
          });
          const { data, error } = await res.json();`
);

repl('src/pages/documents/CreateInvoice.tsx',
  `          const { data, error } = await vpsDb
            .from('products')
            .select('*')
            .eq('company_id', profile.company_id);`,
  `          const res = await fetch("/api/vps-fallback", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              table: "products", action: "select", select: "*", filters: [{ column: "company_id", type: "eq", value: profile.company_id }]
            })
          });
          const { data, error } = await res.json();`
);

// 2. PackingListPreview.tsx
repl('src/pages/documents/PackingListPreview.tsx',
  `        const { data: order, error } = await vpsDb
          .from("export_orders")
          .select("*, export_shipments(*)")
          .eq("id", id)
          .single();`,
  `        const res = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "export_orders", action: "select", select: "*, export_shipments(*)", filters: [{ column: "id", type: "eq", value: id }], single: true }) });
        const { data: order, error } = await res.json();`
);

// 3. EmployeeDirectory.tsx
repl('src/pages/employees/EmployeeDirectory.tsx',
  `        const { data: sessData } = await (vpsDb
          .from("user_sessions" as any) as any)
          .select("*")
          .or(\`login_time.gte.\${todayStartsAt.toISOString()},logout_time.is.null\`)
          .order("login_time", { ascending: false });`,
  `        const res = await fetch("/api/vps-fallback", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ table: "user_sessions", action: "select", select: "*", order: { column: "login_time", options: { ascending: false } } }) });
        const { data: sessData } = await res.json();`
);
