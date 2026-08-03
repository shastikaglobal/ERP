const db = require('./db');

db.query("SELECT column_name FROM information_schema.columns WHERE table_name='chart_of_accounts'")
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => setTimeout(()=>process.exit(0), 500));
