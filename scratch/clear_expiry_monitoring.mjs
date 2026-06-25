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

  console.log('--- Checking Supabase expiry_monitoring ---');
  try {
    const { count, error } = await supabase
      .from('expiry_monitoring')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('Supabase expiry_monitoring error:', error.message);
    } else {
      console.log(`Supabase expiry_monitoring count: ${count} rows`);
      // Delete rows
      const { error: delErr, count: delCount } = await supabase
        .from('expiry_monitoring')
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      console.log(`Deleted ${delCount ?? 0} rows from Supabase. error:`, delErr?.message || 'none');
    }
  } catch (e) {
    console.log('Supabase expiry_monitoring does not exist or failed:', e.message);
  }

  console.log('\n--- Checking VPS expiry_monitoring ---');
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM expiry_monitoring');
    console.log(`VPS expiry_monitoring count: ${rows[0].count} rows`);

    const { rowCount } = await pool.query('DELETE FROM expiry_monitoring');
    console.log(`Deleted ${rowCount} rows from VPS expiry_monitoring.`);
  } catch (err) {
    console.log('VPS expiry_monitoring does not exist or failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
