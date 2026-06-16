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
    console.log(`Connecting to VPS DB at ${process.env.PG_HOST || '195.35.22.13'} (DB: shastika_erp)...`);
    const { rows: tables } = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    console.log('\n=== TABLES AND COUNTS ===');
    for (const t of tables) {
      const tableName = t.table_name;
      try {
        const { rows } = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
        console.log(` - ${tableName}: ${rows[0].count} rows`);
      } catch (err) {
        console.log(` - ${tableName}: Error getting count (${err.message})`);
      }
    }

    // Inspect some specific tables for dummy data
    const tablesToCheck = ['inventory_batches', 'products', 'shipments', 'activity_logs', 'warehouses', 'warehouse_stock', 'damaged_stock', 'leads', 'customers'];
    for (const table of tablesToCheck) {
      if (tables.some(t => t.table_name === table)) {
        console.log(`\n=== Sample from ${table} ===`);
        const { rows } = await pool.query(`SELECT * FROM "${table}" LIMIT 5`);
        console.log(JSON.stringify(rows, null, 2));
      } else {
        console.log(`\nTable ${table} does not exist.`);
      }
    }

  } catch (err) {
    console.error('Fatal connection error:', err);
  } finally {
    await pool.end();
  }
}

main();
