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

const DUMMY_IDS = [
  '3e1c793a-92b0-4589-9e9a-6cc6571bbea8',
  'c8d56c9e-9228-4002-a799-cf762786e506',
  '77991729-276a-4eea-b1c4-8284513376a3',
  '9a45e1a3-d4dd-4543-92b5-8879421760cc',
  '356fdd7b-2ae5-4941-9541-1e3f167d3a44',
  'd775c79d-4f10-4a7f-91e8-79b6a436d4db',
  '413026d4-673a-4fc6-b0d1-305fa751c8fb',
  'b3060c40-9733-4a09-9b83-508a21437f42',
  'e685afa2-3910-4d67-88b4-12335f613fa4'
];

async function run() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('--- Checking Supabase References ---');
  for (const table of ['follow_ups', 'crm_tasks', 'call_logs', 'quotations', 'invoices']) {
    try {
      const { data: leadRef, error: err1 } = await supabase
        .from(table)
        .select('*')
        .in('lead_id', DUMMY_IDS);
      if (!err1 && leadRef && leadRef.length > 0) {
        console.log(`Table ${table} has ${leadRef.length} rows referencing dummy leads:`, leadRef.map(r => r.id));
      }
    } catch (e) {}

    try {
      const { data: custRef, error: err2 } = await supabase
        .from(table)
        .select('*')
        .in('customer_id', DUMMY_IDS);
      if (!err2 && custRef && custRef.length > 0) {
        console.log(`Table ${table} has ${custRef.length} rows referencing dummy customers:`, custRef.map(r => r.id));
      }
    } catch (e) {}
  }

  console.log('\n--- Checking VPS DB References ---');
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    for (const table of ['follow_ups', 'crm_tasks', 'call_logs', 'quotations', 'invoices']) {
      try {
        const { rows: leadRef } = await pool.query(
          `SELECT id FROM ${table} WHERE lead_id = ANY($1)`,
          [DUMMY_IDS]
        );
        if (leadRef.length > 0) {
          console.log(`VPS Table ${table} has ${leadRef.length} rows referencing dummy leads:`, leadRef.map(r => r.id));
        }
      } catch (e) {}

      try {
        const { rows: custRef } = await pool.query(
          `SELECT id FROM ${table} WHERE customer_id = ANY($1)`,
          [DUMMY_IDS]
        );
        if (custRef.length > 0) {
          console.log(`VPS Table ${table} has ${custRef.length} rows referencing dummy customers:`, custRef.map(r => r.id));
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

run();
