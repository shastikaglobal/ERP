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
    const res = await pool.query("SELECT id, full_name, biometric_id FROM profiles ORDER BY full_name");
    console.log("Profiles with biometric IDs:");
    res.rows.forEach(r => console.log(r));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
