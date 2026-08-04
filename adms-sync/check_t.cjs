require('dotenv').config({path: '../.env'});
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
  .then(r => console.log(r.rows.map(t=>t.table_name).join(',')))
  .catch(console.error)
  .finally(() => process.exit(0));
