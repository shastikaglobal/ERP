require('dotenv').config({path: '../.env'});
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});
pool.query("SELECT id, email, password_hash, force_password_reset FROM profiles WHERE email = 'kim.swathi.07@gmail.com'")
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => process.exit(0));
