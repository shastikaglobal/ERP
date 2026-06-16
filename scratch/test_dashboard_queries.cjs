const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/ERP/ERP/adms-sync/.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    console.log('--- Querying products ---');
    const { data: products, error: pError } = await supabase
      .from("products")
      .select("id, name, current_stock, minimum_stock")
      .lt("current_stock", "minimum_stock")
      .limit(5);
    if (pError) console.error('Products error:', pError);
    else console.log('Products:', products);

    console.log('--- Querying shipments ---');
    const today = new Date().toISOString().split('T')[0];
    const { data: shipments, error: sError } = await supabase
      .from("shipments")
      .select("id, shipment_number, status, created_at")
      .gte("created_at", today)
      .eq("status", "dispatched")
      .limit(5);
    if (sError) console.error('Shipments error:', sError);
    else console.log('Shipments:', shipments);

    console.log('--- Querying activity_logs ---');
    const { data: logs, error: lError } = await supabase
      .from("activity_logs")
      .select("id, action, user_id, created_at")
      .gte("created_at", today)
      .order("created_at", { ascending: false })
      .limit(5);
    if (lError) console.error('Activity logs error:', lError);
    else console.log('Activity logs:', logs);

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
