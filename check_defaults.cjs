const db = require('./adms-sync/db');
db.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name='farmers'")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
