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

// Target dummy IDs we identified
const SB_CUSTOMER_IDS = [
  '3e1c793a-92b0-4589-9e9a-6cc6571bbea8',
  'c8d56c9e-9228-4002-a799-cf762786e506',
  '77991729-276a-4eea-b1c4-8284513376a3',
  '9a45e1a3-d4dd-4543-92b5-8879421760cc',
  '356fdd7b-2ae5-4941-9541-1e3f167d3a44',
  'd775c79d-4f10-4a7f-91e8-79b6a436d4db'
];

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

const VPS_FOLLOWUP_IDS = [
  '0f24b044-e7c4-4465-8d12-b7114afd31c7'
];

async function run() {
  console.log('⚡ Starting deletion of dummy CRM records...');

  // 1. SUPABASE DELETIONS
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('\n--- Cleaning Supabase ---');

  // Deleting dummy customers
  const { error: sbCustErr, count: sbCustCount } = await supabase
    .from('customers')
    .delete({ count: 'exact' })
    .in('id', SB_CUSTOMER_IDS);
  
  if (sbCustErr) {
    console.error('❌ Supabase customers delete error:', sbCustErr.message);
  } else {
    console.log(`✅ Deleted ${sbCustCount} dummy customers from Supabase.`);
  }

  // Deleting dummy leads
  const { error: sbLeadErr, count: sbLeadCount } = await supabase
    .from('leads')
    .delete({ count: 'exact' })
    .in('id', SB_LEAD_IDS);

  if (sbLeadErr) {
    console.error('❌ Supabase leads delete error:', sbLeadErr.message);
  } else {
    console.log(`✅ Deleted ${sbLeadCount} dummy leads from Supabase.`);
  }

  // 2. VPS DELETIONS
  console.log('\n--- Cleaning VPS Database ---');
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    // Delete follow ups referencing target leads first
    const { rowCount: vpsFollowUpCount } = await pool.query(
      'DELETE FROM follow_ups WHERE id = ANY($1) OR lead_id = ANY($2)',
      [VPS_FOLLOWUP_IDS, VPS_LEAD_IDS]
    );
    console.log(`✅ Deleted ${vpsFollowUpCount} dummy follow-ups from VPS.`);

    // Delete leads
    const { rowCount: vpsLeadCount } = await pool.query(
      'DELETE FROM leads WHERE id = ANY($1)',
      [VPS_LEAD_IDS]
    );
    console.log(`✅ Deleted ${vpsLeadCount} dummy leads from VPS.`);

    // Delete customers
    const { rowCount: vpsCustCount } = await pool.query(
      'DELETE FROM customers WHERE id = ANY($1)',
      [VPS_CUSTOMER_IDS]
    );
    console.log(`✅ Deleted ${vpsCustCount} dummy customers from VPS.`);

  } catch (err) {
    console.error('❌ VPS delete error:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n🎉 Finished cleaning dummy CRM records!');
}

run().catch(console.error);
