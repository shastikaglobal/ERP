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
  console.log('⚡ Clearing sales, shipments, purchase orders, and invoices...');

  // 1. SUPABASE
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('\n--- Clearing Supabase ---');

  // Deletion order for foreign keys
  const sbTables = [
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
    'journal_entries'
  ];

  for (const table of sbTables) {
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
    for (const table of sbTables) {
      const { rowCount } = await pool.query(`DELETE FROM ${table}`);
      console.log(`Deleted ${rowCount} rows from ${table} in VPS.`);
    }
  } catch (err) {
    console.error('❌ VPS DB error:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n🎉 Finished clearing Revenue & Performance data!');
}

run().catch(console.error);
