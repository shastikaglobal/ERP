const db = require('./adms-sync/db');

async function run() {
  try {
    const id = '2001';
    console.log(`Checking local database for ID: ${id}`);
    
    const { rows } = await db.query(
      `SELECT email, full_name, role FROM profiles WHERE (employee_id = $1 OR biometric_id = $2) AND is_deleted IS NOT TRUE LIMIT 1`,
      [id, id]
    );

    console.log("Rows:", rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
