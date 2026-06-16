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
    const res = await pool.query("SELECT id, receiving_id, status FROM packing_protocols");
    console.log("--- PACKING PROTOCOLS ---");
    res.rows.forEach(r => {
      console.log(`id: ${r.id} | receiving_id: "${r.receiving_id}" | status: "${r.status}"`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
