const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/ERP/ERP/adms-sync/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanSupabase() {
  const tables = [
    'leads',
    'client_acquisition',
    'customers',
    'follow_ups',
    'activities',
    'lead_activities',
    'crm_tasks',
    'quotations',
    'export_orders'
  ];

  console.log('=== Cleaning up dummy data from Supabase ===');
  for (const table of tables) {
    try {
      // In Supabase, deleting where id is not null deletes all rows
      const { data, error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // matches everything
        
      if (error) throw error;
      console.log(`✅ Cleared ${table}`);
    } catch (err) {
      console.log(`❌ Failed to clear ${table}: ${err.message || err.details || err}`);
    }
  }
}

cleanSupabase();
