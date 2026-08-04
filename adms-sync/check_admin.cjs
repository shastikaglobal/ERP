require('dotenv').config({path: '../.env'});
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});
pool.query("SELECT id FROM profiles WHERE email = 'shastikaglobal11@gmail.com'")
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => process.exit(0));
