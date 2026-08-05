const { Pool } = require('pg');
const pool = new Pool({
  user: 'erp_admin',
  host: '195.35.22.13',
  database: 'shastika_erp',
  password: 'Shastika2026Secure',
  port: 5432
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM farmers ORDER BY created_at DESC LIMIT 2");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
