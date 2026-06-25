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
  'container_loading',
  'container_types',
  'shipment_batches',
  'shipment_events'
];

async function run() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('--- Checking Supabase Counts ---');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      console.log(`  ${table.padEnd(25)}: ${count ?? 0} rows ${error ? `(Error: ${error.message})` : ''}`);
    } catch (e) {
      console.log(`  ${table.padEnd(25)}: Error: ${e.message}`);
    }
  }

  console.log('\n--- Checking VPS DB Counts ---');
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
        console.log(`  ${table.padEnd(25)}: ${rows[0].count} rows`);
      } catch (err) {
        console.log(`  ${table.padEnd(25)}: Error: ${err.message}`);
      }
    }

    // Now clear them
    console.log('\n--- Clearing VPS Tables ---');
    // Delete in order of dependencies (events/loading reference shipments/containers)
    for (const table of ['shipment_events', 'container_loading', 'shipment_batches', 'container_types']) {
      try {
        // Skip container_types if it's static configuration
        if (table === 'container_types') {
          const { rows: sample } = await pool.query('SELECT * FROM container_types LIMIT 5');
          console.log('Container types sample:', sample);
          console.log('Keeping container_types intact as it is configuration metadata.');
          continue;
        }

        const { rowCount } = await pool.query(`DELETE FROM ${table}`);
        console.log(`Deleted ${rowCount} rows from ${table} in VPS.`);
      } catch (err) {
        console.log(`Error deleting from ${table}: ${err.message}`);
      }
    }

    console.log('\n--- Clearing Supabase Tables ---');
    for (const table of ['shipment_events', 'container_loading', 'shipment_batches']) {
      const { error, count } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      console.log(`Deleted ${count ?? 0} rows from ${table} in Supabase. error:`, error?.message || 'none');
    }

  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

run();
