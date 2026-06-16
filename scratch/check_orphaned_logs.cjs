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
      SELECT a.employee_id, COUNT(*) as count 
      FROM attendance_logs a
      LEFT JOIN profiles p ON a.employee_id = p.id
      WHERE p.id IS NULL
      GROUP BY a.employee_id
    `);
    console.log("Orphaned attendance logs (where employee does not exist in profiles):");
    res.rows.forEach(r => console.log(r));

    const res2 = await pool.query(`
      SELECT a."EmployeeCode", COUNT(*) as count 
      FROM "AttLogs" a
      LEFT JOIN profiles p ON a."EmployeeCode" = p.biometric_id
      WHERE p.id IS NULL
      GROUP BY a."EmployeeCode"
    `);
    console.log("\nOrphaned raw AttLogs (where biometric_id does not exist in profiles):");
    res2.rows.forEach(r => console.log(r));

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
