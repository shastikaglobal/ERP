const db = require('./adms-sync/db');
db.query("SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = 'farmers'::regclass")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
