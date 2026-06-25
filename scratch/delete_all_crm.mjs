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
  console.log('⚡ Clearing ALL CRM data (customers, leads, follow-ups, tasks, logs)...');

  // 1. SUPABASE
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('\n--- Clearing Supabase ---');

  // Clear follow-ups, tasks, logs
  const { error: sbFolErr, count: sbFolCount } = await supabase.from('follow_ups').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`Deleted ${sbFolCount ?? 0} follow-ups in Supabase. error:`, sbFolErr?.message || 'none');

  const { error: sbTaskErr, count: sbTaskCount } = await supabase.from('crm_tasks').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`Deleted ${sbTaskCount ?? 0} crm_tasks in Supabase. error:`, sbTaskErr?.message || 'none');

  const { error: sbCallErr, count: sbCallCount } = await supabase.from('call_logs').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`Deleted ${sbCallCount ?? 0} call_logs in Supabase. error:`, sbCallErr?.message || 'none');

  // Delete customers
  const { error: sbCustErr, count: sbCustCount } = await supabase.from('customers').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`Deleted ${sbCustCount ?? 0} customers in Supabase. error:`, sbCustErr?.message || 'none');

  // Soft-delete leads (since hard delete is prohibited on leads)
  const { error: sbLeadErr, count: sbLeadCount } = await supabase.from('leads').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('is_deleted', false);
  console.log(`Soft-deleted leads in Supabase. error:`, sbLeadErr?.message || 'none');

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
    const { rowCount: folCount } = await pool.query('DELETE FROM follow_ups');
    console.log(`Deleted ${folCount} follow-ups in VPS.`);

    const { rowCount: taskCount } = await pool.query('DELETE FROM crm_tasks');
    console.log(`Deleted ${taskCount} crm_tasks in VPS.`);

    const { rowCount: callCount } = await pool.query('DELETE FROM call_logs');
    console.log(`Deleted ${callCount} call_logs in VPS.`);

    const { rowCount: custCount } = await pool.query('DELETE FROM customers');
    console.log(`Deleted ${custCount} customers in VPS.`);

    const { rowCount: leadCount } = await pool.query('UPDATE leads SET is_deleted = true, deleted_at = NOW() WHERE is_deleted = false OR is_deleted IS NULL');
    console.log(`Soft-deleted ${leadCount} leads in VPS.`);

  } catch (err) {
    console.error('❌ VPS DB error:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n🎉 Finished clearing CRM data!');
}

run().catch(console.error);
