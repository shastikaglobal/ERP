require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function verify() {
  const client = new Client({
    host: '195.35.22.13',
    port: 5432,
    user: 'erp_admin',
    password: process.env.PG_PASSWORD,
    database: 'shastika_erp'
  });

  await client.connect();
  const { rows } = await client.query("SELECT id, email, full_name, role, requested_role, password_hash, status FROM profiles WHERE employee_id = '2001'");
  const u = rows[0];
  console.log('Name:', u.full_name);
  console.log('Email:', u.email);
  console.log('Role:', u.role);
  console.log('Requested Role:', u.requested_role);
  console.log('Status:', u.status);
  const ok = await bcrypt.compare('Swathi@2026', u.password_hash);
  console.log('Password "Swathi@2026" matches:', ok);
  await client.end();
}
verify().catch(console.error);
