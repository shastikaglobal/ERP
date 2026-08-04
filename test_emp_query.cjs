const db = require('./adms-sync/db');

async function run() {
  try {
    const { rows } = await db.query(`
      SELECT id, company_id, full_name, email, phone, requested_role, status, is_active, 
             avatar_url, biometric_id, dob, joining_date, system_mode, city, 
             monthly_salary, punch_deadline, department 
      FROM profiles 
      WHERE status = 'approved' AND (is_deleted IS NOT TRUE)
      ORDER BY full_name
    `);
    console.log("Success! Returned rows:", rows.length);
  } catch (e) {
    console.error("Query failed:", e.message);
  } finally {
    process.exit(0);
  }
}

run();
