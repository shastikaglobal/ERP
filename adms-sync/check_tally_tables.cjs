const db = require('./db');

db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
  .then(r => {
    console.log(r.rows.map(row => row.table_name).filter(t => [
      'parties', 'chart_of_accounts', 'journal_entries', 'journal_entry_rows', 'gst_transactions', 'payments'
    ].includes(t)));
  })
  .catch(console.error)
  .finally(() => setTimeout(()=>process.exit(0), 500));
