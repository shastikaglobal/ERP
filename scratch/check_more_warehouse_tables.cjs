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
    const tables = ['qc_inspections', 'export_ready_inventory', 'reserved_stock', 'shipment_batches', 'expiry_monitoring'];
    for (const t of tables) {
      console.log(`\n=== Sample from ${t} ===`);
      const { rows } = await pool.query(`SELECT * FROM "${t}" LIMIT 10`);
      console.log(JSON.stringify(rows, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
