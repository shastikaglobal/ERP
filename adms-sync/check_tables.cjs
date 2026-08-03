const db = require('./db');
db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
  .then(r => {
    console.log(r.rows.map(row => row.table_name).filter(t => t.includes('farm') || t.includes('procure') || t.includes('purchase')));
  })
  .catch(console.error)
  .finally(() => setTimeout(()=>process.exit(0), 500));
