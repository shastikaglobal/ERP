require('dotenv').config({path: '../.env'});
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='employees'")
  .then(r => console.log(JSON.stringify(r.rows, null, 2)))
  .catch(console.error)
  .finally(() => process.exit(0));
