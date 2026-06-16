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
    const res = await pool.query(`
      SELECT routine_definition 
      FROM information_schema.routines 
      WHERE routine_name = 'prevent_deletion'
    `);
    console.log("Routine prevent_deletion definition:");
    console.log(res.rows[0]?.routine_definition);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
