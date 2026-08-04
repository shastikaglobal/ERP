const db = require('./adms-sync/db');

async function run() {
  try {
    const { rows } = await db.query(
      'SELECT id, full_name, email, role, biometric_id FROM profiles WHERE is_deleted IS NOT TRUE ORDER BY full_name ASC'
    );
    
    console.log("=== EMPLOYEES WITH BIOMETRIC ID ===");
    rows.filter(r => r.biometric_id).forEach(r => {
      console.log(`[${r.biometric_id}] - ${r.full_name} (${r.email}) - ${r.role}`);
    });
    
    console.log("\n=== EMPLOYEES WITHOUT BIOMETRIC ID ===");
    rows.filter(r => !r.biometric_id).forEach(r => {
      console.log(`[NO ID] - ${r.full_name} (${r.email}) - ${r.role}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
