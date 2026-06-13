const db = require('../adms-sync/db');
db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'quotations'`)
  .then(r => console.log(r.rows.map(x => x.column_name)))
  .catch(console.error)
  .finally(() => process.exit());
