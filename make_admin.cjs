const { Client } = require('pg');
require('dotenv').config({ path: 'adms-sync/.env' });

async function setAdmin() {
  const client = new Client({
    host: process.env.PG_HOST || '195.35.22.13',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || 'erp_admin',
    password: process.env.PG_PASSWORD || 'Xk9$mQ2vL7pR4wZ8nT3y',
    database: process.env.PG_DATABASE || 'shastika_erp'
  });

  try {
    await client.connect();
    // Update role
    const res = await client.query("UPDATE profiles SET role = 'admin', requested_role = 'admin' WHERE employee_id = '2001'");
    console.log("Made user 2001 admin. Rows affected:", res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
setAdmin();
