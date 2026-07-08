const db = require('./adms-sync/db');
db.query("SELECT id, full_name, created_by, created_by_name, created_at FROM farmers ORDER BY created_at DESC LIMIT 5")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
