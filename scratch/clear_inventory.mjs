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
  'warehouse_stock',
  'available_stock',
  'reserved_stock',
  'damaged_stock',
  'inventory_batches',
  'warehouses'
];

async function run() {
  console.log('⚡ Clearing warehouse and inventory data...');

  // 1. SUPABASE
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('\n--- Clearing Supabase ---');

  for (const table of tables) {
    const { error, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    console.log(`Deleted ${count ?? 0} rows from ${table} in Supabase. error:`, error?.message || 'none');
  }

  // 2. VPS DATABASE
  console.log('\n--- Clearing VPS Database ---');
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    for (const table of tables) {
      const { rowCount } = await pool.query(`DELETE FROM ${table}`);
      console.log(`Deleted ${rowCount} rows from ${table} in VPS.`);
    }
  } catch (err) {
    console.error('❌ VPS DB error:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n🎉 Finished clearing Warehouse and Inventory data!');
}

run().catch(console.error);
