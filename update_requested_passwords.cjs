const db = require('./adms-sync/db');
const bcrypt = require('bcryptjs');

const passwords = {
  '1001': 'shastika-1001',
  '1003': 'shastika-1003',
  '1006': 'shastika-1006',
  '1007': 'shastika-1007',
  '1008': 'shastika-1008',
  '1013': 'shastika-1013',
  '1020': 'shastika-1020',
  '1021': 'shastika-1021',
  '1022': 'shastika-1022',
  '2001': 'shastika-2001'
};

async function run() {
  try {
    // 1. Handle duplicate 2001
    console.log("Removing duplicate profile for 2001 (id: 2031a8a5-0178-4c94-862d-2dce93ba6b2a)");
    await db.query(`UPDATE profiles SET is_deleted = true, is_active = false WHERE id = '2031a8a5-0178-4c94-862d-2dce93ba6b2a'`);

    // 2. Set passwords
    for (const [empId, password] of Object.entries(passwords)) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const res = await db.query(
        `UPDATE profiles SET password_hash = $1, force_password_reset = true WHERE employee_id = $2 AND is_deleted IS NOT TRUE`,
        [hash, empId]
      );
      console.log(`Updated Employee ID ${empId}: ${res.rowCount} row(s) updated`);
    }

    // 3. Verify
    console.log("\n=== VERIFICATION ===");
    const { rows } = await db.query(
      `SELECT employee_id, full_name, password_hash, force_password_reset 
       FROM profiles 
       WHERE employee_id = ANY($1) AND is_deleted IS NOT TRUE
       ORDER BY employee_id`,
      [Object.keys(passwords)]
    );
    
    // Mask hash for safety output
    const safeRows = rows.map(r => ({
      ...r,
      password_hash: r.password_hash ? r.password_hash.substring(0, 15) + '...' : 'NULL'
    }));
    
    console.table(safeRows);

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
