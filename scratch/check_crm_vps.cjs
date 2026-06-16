const { Client } = require('pg');
require('dotenv').config({ path: 'd:/ERP/ERP/adms-sync/.env' });

async function checkCRMData() {
  const client = new Client({
    user: 'erp_admin',
    host: process.env.PG_HOST || '127.0.0.1',
    database: 'shastika_erp',
    password: process.env.PG_PASSWORD,
    port: 5432,
  });

  try {
    await client.connect();
    
    const tables = [
      'leads',
      'activities',
      'follow_ups',
      'crm_tasks',
      'client_acquisition',
      'quotations',
      'export_orders'
    ];

    for (const table of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`${table}: ${res.rows[0].count} rows`);
        
        // Also check some sample data
        if (parseInt(res.rows[0].count) > 0) {
           const sample = await client.query(`SELECT * FROM ${table} LIMIT 2`);
           console.log(`  Sample ${table}:`, JSON.stringify(sample.rows));
        }
      } catch (err) {
        console.log(`${table}: Error or does not exist (${err.message})`);
      }
    }
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

checkCRMData();
