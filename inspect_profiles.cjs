const db = require('./adms-sync/db.js');
async function inspect() {
  const reqRes = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
  console.log('profiles columns:', reqRes.rows.map(r => r.column_name));
  process.exit(0);
}
inspect().catch(err => { console.error(err); process.exit(1); });
