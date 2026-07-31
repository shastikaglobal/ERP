const { Pool } = require('pg');
const pool = new Pool({
  user: 'erp_admin',
  host: '195.35.22.13',
  database: 'shastika_erp',
  password: 'Xk9$mQ2vL7pR4wZ8nT3y',
  port: 5432
});

pool.query("SELECT email, full_name, role FROM profiles WHERE (employee_id = $1 OR biometric_id = $2) AND is_deleted IS NOT TRUE LIMIT 1", ['2001', '2001'], (err, res) => {
  if (err) console.error(err);
  else console.log("Result:", res.rows);
  pool.end();
});
