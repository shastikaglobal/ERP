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

const tables = [
  'notifications',
  'app_notifications'
];

async function run() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('--- Checking & Clearing Supabase Notifications ---');
  for (const table of tables) {
    try {
      const { count, error: countErr } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`${table}: ${count ?? 0} rows`);

      if (count && count > 0) {
        const { error: delErr, count: delCount } = await supabase
          .from(table)
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        console.log(`  Deleted ${delCount ?? 0} rows from ${table} in Supabase. error:`, delErr?.message || 'none');
      }
    } catch (e) {
      console.log(`Failed on Supabase table ${table}:`, e.message);
    }
  }

  console.log('\n--- Checking & Clearing VPS Notifications ---');
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    for (const table of tables) {
      try {
        const { rows } = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`${table}: ${rows[0].count} rows`);

        if (parseInt(rows[0].count, 10) > 0) {
          const { rowCount } = await pool.query(`DELETE FROM ${table}`);
          console.log(`  Deleted ${rowCount} rows from ${table} in VPS.`);
        }
      } catch (err) {
        console.log(`VPS table ${table} failed:`, err.message);
      }
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }

  console.log('\n🎉 Finished clearing notifications!');
}

run();
