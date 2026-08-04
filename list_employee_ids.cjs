const db = require('./adms-sync/db');

async function run() {
  try {
    const { rows } = await db.query(
      'SELECT id, employee_id, full_name, email FROM profiles WHERE is_deleted IS NOT TRUE ORDER BY employee_id'
    );
    
    console.log("| Employee ID | Full Name | Email |");
    console.log("|---|---|---|");
    rows.forEach(r => {
      console.log(`| ${r.employee_id || 'N/A'} | ${r.full_name} | ${r.email} |`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
