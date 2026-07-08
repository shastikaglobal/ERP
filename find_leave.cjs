const db = require('./adms-sync/db.js');
db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%leave%'").then(res => {
  console.log('Leave tables:', res.rows.map(r => r.table_name));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
