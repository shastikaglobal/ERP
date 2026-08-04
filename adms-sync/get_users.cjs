require('dotenv').config({path: '../.env'});
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});
pool.query("SELECT employee_id, full_name, email, role FROM profiles ORDER BY employee_id ASC NULLS LAST")
  .then(r => console.log(JSON.stringify(r.rows, null, 2)))
  .catch(console.error)
  .finally(() => process.exit(0));
