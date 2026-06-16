const { Client } = require('pg');
require('dotenv').config({ path: 'd:/ERP/ERP/adms-sync/.env' });

async function clearCRMData() {
  const client = new Client({
    user: 'erp_admin',
    host: process.env.PG_HOST || '127.0.0.1',
    database: 'shastika_erp',
    password: process.env.PG_PASSWORD,
    port: 5432,
  });

  try {
    await client.connect();
    
    console.log("=== Cleaning up dummy data from VPS DB ===");

    // We use DELETE instead of TRUNCATE to avoid FK constraint issues easily,
    // though TRUNCATE CASCADE is also an option. We'll use TRUNCATE CASCADE for a clean slate.
    const tablesToClean = [
      'activities',
      'follow_ups',
      'crm_tasks',
      'client_acquisition',
      'quotation_items',
      'quotations',
      'leads'
    ];

    for (const table of tablesToClean) {
      try {
        const res = await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`✅ Cleared ${table}`);
      } catch (err) {
        console.log(`❌ Failed to clear ${table}: ${err.message}`);
      }
    }
    
    console.log("Dummy data successfully removed from leads, pipelines, and follow-ups.");

  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

clearCRMData();
