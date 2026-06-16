const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/ERP/ERP/adms-sync/.env' });

const pool = new Pool({
  user: 'erp_admin',
  host: process.env.PG_HOST || '195.35.22.13',
  database: 'shastika_erp',
  password: process.env.PG_PASSWORD || 'Shastika2026',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('--- available_stock rows ---');
    const { rows: stock } = await pool.query('SELECT * FROM available_stock LIMIT 5');
    console.log(stock);

    console.log('--- export_shipments rows ---');
    const { rows: shipments } = await pool.query('SELECT * FROM export_shipments LIMIT 5');
    console.log(shipments);

    console.log('--- activity_logs row count and sample ---');
    const { rows: logsCount } = await pool.query('SELECT COUNT(*) FROM activity_logs');
    console.log('Total activity_logs count:', logsCount[0].count);
    const { rows: logs } = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5');
    console.log(logs);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
