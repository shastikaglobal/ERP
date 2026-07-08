const db = require('./adms-sync/db');
db.query("SELECT DISTINCT workflow_status FROM farmers")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
