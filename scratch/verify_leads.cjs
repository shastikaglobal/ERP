const jwt = require('jsonwebtoken');

// Decode the Supabase service role key to see the secret
// Actually, the Supabase JWT secret is what we need to sign a token.
// The service_role key is a JWT itself. Let's just USE the service role key as the Bearer token!
// The adms-sync middleware expects a Bearer token and verifies it with supabase.auth.getUser()

// Wait! supabase.auth.getUser() does NOT accept service_role keys. It expects a user access token.
// We can use Supabase admin API to generate a user link or just fetch from the VPS DB locally.

// Let's just query the VPS DB locally and see if it REALLY has 0 leads.
const { Client } = require('pg');

async function check() {
  const client = new Client({
    user: 'erp_admin',
    host: '195.35.22.13',
    database: 'shastika_erp',
    password: 'Shastika2026',
    port: 5432
  });
  
  await client.connect();
  const res = await client.query('SELECT * FROM leads');
  console.log("LEADS IN VPS DB:", res.rows.length);
  await client.end();
}

check();
