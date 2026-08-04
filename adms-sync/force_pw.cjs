require('dotenv').config({path: '../.env'});
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});
bcrypt.hash('temp-1007', 10)
  .then(hash => pool.query("UPDATE profiles SET password_hash = $1 WHERE email = 'kim.swathi.07@gmail.com'", [hash]))
  .then(() => console.log('Password forced to temp-1007'))
  .catch(console.error)
  .finally(() => process.exit(0));
