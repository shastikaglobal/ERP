const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || '195.35.22.13',
  user: 'erp_admin',
  password: process.env.PG_PASSWORD || 'Shastika2026',
  database: 'shastika_erp',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res1 = await pool.query("SELECT * FROM export_orders LIMIT 5");
    console.log("--- EXPORT ORDERS ---");
    res1.rows.forEach(r => console.log(r));

    const res2 = await pool.query("SELECT * FROM export_shipments LIMIT 5");
    console.log("--- EXPORT SHIPMENTS ---");
    res2.rows.forEach(r => console.log(r));

    const res3 = await pool.query("SELECT * FROM export_containers LIMIT 5");
    console.log("--- EXPORT CONTAINERS ---");
    res3.rows.forEach(r => console.log(r));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
