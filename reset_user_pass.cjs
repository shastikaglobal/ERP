const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'adms-sync/.env' });

async function resetPass() {
  const client = new Client({
    host: process.env.PG_HOST || '195.35.22.13',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || 'erp_admin',
    password: process.env.PG_PASSWORD || 'Xk9$mQ2vL7pR4wZ8nT3y',
    database: process.env.PG_DATABASE || 'shastika_erp'
  });

  try {
    await client.connect();
    const hash = await bcrypt.hash('Swathi@2026', 10);
    const res = await client.query("UPDATE profiles SET password_hash = $1 WHERE employee_id = '2001'", [hash]);
    console.log("Password reset successfully. Rows affected:", res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
resetPass();
