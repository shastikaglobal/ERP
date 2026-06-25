import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
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
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('--- Checking Supabase Tables for "expiry" ---');
  const { data: tables, error } = await supabase.rpc('get_tables'); // Or try standard query if rpc doesn't exist
  
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%expiry%';
    `);
    console.log('VPS database matching tables:', rows);
  } catch (err) {
    console.error('Error querying VPS database:', err.message);
  } finally {
    await pool.end();
  }
}

run();
