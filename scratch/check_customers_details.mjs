import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

async function run() {
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    const { rows } = await pool.query(`SELECT * FROM customers`);
    console.log("VPS Customers:", rows);
  } catch (err) {
    console.error("VPS PG Error:", err.message);
  } finally {
    await pool.end();
  }

  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from('customers').select('*');
  if (error) {
    console.error("Supabase Error:", error.message);
  } else {
    console.log("Supabase Customers:", data);
  }
}
run();
