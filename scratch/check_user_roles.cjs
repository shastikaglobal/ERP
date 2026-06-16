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
    const res = await pool.query("SELECT * FROM user_roles");
    console.log("--- USER ROLES ROWS ---");
    res.rows.forEach(r => console.log(r));

    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_roles'
    `);
    console.log("\n--- USER ROLES COLUMNS ---");
    columns.rows.forEach(c => console.log(c));

    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'user_roles'::regclass
    `);
    console.log("\n--- USER ROLES CONSTRAINTS ---");
    constraints.rows.forEach(c => console.log(c));

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
