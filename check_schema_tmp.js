const db = require('./adms-sync/db');
db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'")
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => process.exit(0));
