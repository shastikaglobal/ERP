const db = require('./adms-sync/db.js');
async function inspect() {
  const reqRes = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leave_requests'");
  console.log('leave_requests columns:', reqRes.rows);
  
  process.exit(0);
}
inspect().catch(err => { console.error(err); process.exit(1); });
