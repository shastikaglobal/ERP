const db = require('./adms-sync/db');
db.query("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'farm_visits'")
  .then(res => {
    console.log(res.rows);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
