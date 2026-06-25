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
  'quotation_items',
  'quotations',
  'export_containers',
  'shipment_dispatches',
  'export_shipments',
  'export_orders',
  'purchase_order_items',
  'purchase_orders',
  'payments',
  'invoices',
  'journal_entries',
  'chart_of_accounts'
];

async function run() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('--- SUPABASE COUNTS ---');
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`  ${table.padEnd(25)}: ${count ?? 0} rows ${error ? `(Error: ${error.message})` : ''}`);
  }

  console.log('\n--- VPS DB COUNTS ---');
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
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

run();
