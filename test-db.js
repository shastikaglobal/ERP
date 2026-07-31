const { Pool } = require('pg');
const pool = new Pool({
  user: 'erp_admin',
  host: '195.35.22.13',
  database: 'shastika_erp',
  password: 'Xk9$mQ2vL7pR4wZ8nT3y',
  port: 5432
});

pool.query(\"SELECT id, email, full_name, role, employee_id, biometric_id, is_deleted FROM profiles WHERE employee_id='2001' OR biometric_id='2001'\", (err, res) => {
  if (err) console.error(err);
  else console.log(res.rows);
  pool.end();
});
