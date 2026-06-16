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
    // 1. Check profiles
    const profs = await pool.query("SELECT id, full_name, email, role, department, status, is_active FROM profiles");
    console.log(`=== PROFILES (${profs.rows.length}) ===`);
    profs.rows.forEach(p => console.log(p));

    // 2. Check activities
    const acts = await pool.query("SELECT id, title, completed, created_at, updated_at FROM activities LIMIT 10");
    console.log(`\n=== ACTIVITIES (sample, total=${(await pool.query("SELECT COUNT(*) FROM activities")).rows[0].count}) ===`);
    acts.rows.forEach(a => console.log(a));

    // 3. Check attendance_logs
    const att = await pool.query("SELECT id, employee_id, date, status, clock_in, clock_out FROM attendance_logs LIMIT 10");
    console.log(`\n=== ATTENDANCE_LOGS (sample, total=${(await pool.query("SELECT COUNT(*) FROM attendance_logs")).rows[0].count}) ===`);
    att.rows.forEach(x => console.log(x));

    // 4. Check leads
    const leads = await pool.query("SELECT id, company_name, contact_name, stage, created_at FROM leads LIMIT 10");
    console.log(`\n=== LEADS (sample, total=${(await pool.query("SELECT COUNT(*) FROM leads")).rows[0].count}) ===`);
    leads.rows.forEach(l => console.log(l));

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

main();
