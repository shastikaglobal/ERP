const db = require('./db');
db.query("SELECT table_name FROM information_schema.views WHERE table_schema='public'")
  .then(r => console.log(r.rows.map(row => row.table_name).includes('trial_balance')))
  .catch(console.error)
  .finally(() => setTimeout(()=>process.exit(0), 500));
