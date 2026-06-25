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

const SB_LEAD_IDS = [
  'c8d56c9e-9228-4002-a799-cf762786e506',
  'd775c79d-4f10-4a7f-91e8-79b6a436d4db',
  '3e1c793a-92b0-4589-9e9a-6cc6571bbea8',
  '77991729-276a-4eea-b1c4-8284513376a3'
];

const VPS_CUSTOMER_IDS = [
  '3e1c793a-92b0-4589-9e9a-6cc6571bbea8',
  '356fdd7b-2ae5-4941-9541-1e3f167d3a44',
  '413026d4-673a-4fc6-b0d1-305fa751c8fb',
  'c8d56c9e-9228-4002-a799-cf762786e506',
  '77991729-276a-4eea-b1c4-8284513376a3',
  'd775c79d-4f10-4a7f-91e8-79b6a436d4db',
  '9a45e1a3-d4dd-4543-92b5-8879421760cc',
  'e685afa2-3910-4d67-88b4-12335f613fa4'
];

const VPS_LEAD_IDS = [
  'b3060c40-9733-4a09-9b83-508a21437f42',
  '3e1c793a-92b0-4589-9e9a-6cc6571bbea8',
  'c8d56c9e-9228-4002-a799-cf762786e506',
  '77991729-276a-4eea-b1c4-8284513376a3',
  'd775c79d-4f10-4a7f-91e8-79b6a436d4db'
];

async function run() {
  console.log('⚡ Soft-deleting dummy leads and deleting dummy customers...');

  // 1. SUPABASE
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('\n--- Updating Supabase Leads ---');
  const { error: sbLeadErr, data: sbLeadData } = await supabase
    .from('leads')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .in('id', SB_LEAD_IDS)
    .select();

  if (sbLeadErr) {
    console.error('❌ Supabase leads soft-delete error:', sbLeadErr.message);
  } else {
    console.log(`✅ Soft-deleted ${sbLeadData?.length || 0} dummy leads in Supabase.`);
  }

  // 2. VPS DATABASE
  console.log('\n--- Updating VPS Database ---');
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    // Soft-delete leads in VPS
    const { rowCount: vpsLeadCount } = await pool.query(
      'UPDATE leads SET is_deleted = true, deleted_at = NOW() WHERE id = ANY($1)',
      [VPS_LEAD_IDS]
    );
    console.log(`✅ Soft-deleted ${vpsLeadCount} dummy leads in VPS.`);

    // Delete customers in VPS
    const { rowCount: vpsCustCount } = await pool.query(
      'DELETE FROM customers WHERE id = ANY($1)',
      [VPS_CUSTOMER_IDS]
    );
    console.log(`✅ Deleted ${vpsCustCount} dummy customers from VPS.`);

  } catch (err) {
    console.error('❌ VPS DB error:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n🎉 Finished updating/deleting!');
}

run().catch(console.error);
