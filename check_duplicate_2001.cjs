const db = require('./adms-sync/db');

async function run() {
  try {
    const { rows } = await db.query(
      `SELECT id, employee_id, full_name, email, created_at, updated_at, is_active, status, role 
       FROM profiles 
       WHERE employee_id = '2001'`
    );
    
    console.log("=== Duplicate profiles for 2001 ===");
    console.table(rows);
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
