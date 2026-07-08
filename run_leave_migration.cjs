const fs = require('fs');
const db = require('./adms-sync/db.js');

async function runMigration() {
  try {
    const sql = fs.readFileSync('migration_leave.sql', 'utf8');
    await db.query(sql);
    console.log('Migration successful');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}
runMigration();
