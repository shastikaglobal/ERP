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

// Target IDs we want to soft-delete/delete
const TARGET_LEAD_IDS = [
  'a175795e-ac97-4e64-8a5a-fefe6c1d930c', // SHASTIKA GLOBAL IMPEX PVT LTD
  '4f55baef-d412-4b93-85ae-45c7ea118402', // SHASTIKA GLOBAL IMPEX PVT LTD
  '64285791-a97b-48fc-af20-7566ef24cb18', // shastika global impex pvt ltd
  '2bec8883-c2f6-4eda-b1a0-3e5bbc2db4d9', // shastika global impex pvt ltd
  'd39425a0-9298-48a6-ad71-efd3117f0e0b', // shastika global impex pvt ltd
  '248da76e-d479-4b06-a777-f6f3c032b68c', // alksdallajh
  'c70b7d44-aada-4ff8-9c26-b2acbb2a6f72', // vbmb,
  'd875a9e2-89c1-4c6b-abff-a98516c91787'  // Dr.RANM arts and science college
];

async function run() {
  console.log('⚡ Soft-deleting target dummy leads and clearing any associated customers...');

  // 1. SUPABASE
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('\n--- Cleaning Supabase ---');
  // Soft delete leads
  const { error: sbLeadErr, data: sbLeadData } = await supabase
    .from('leads')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .in('id', TARGET_LEAD_IDS)
    .select();

  if (sbLeadErr) {
    console.error('❌ Supabase leads soft-delete error:', sbLeadErr.message);
  } else {
    console.log(`✅ Soft-deleted ${sbLeadData?.length || 0} leads in Supabase.`);
  }

  // Find customers with similar names/details in Supabase
  const { data: sbCustomers, error: sbCustFetchErr } = await supabase
    .from('customers')
    .select('id, name, email');
  
  if (!sbCustFetchErr && sbCustomers) {
    const dummyCusts = sbCustomers.filter(c => 
      ['shastika', 'alksdallajh', 'vbmb,', 'ranm'].some(term => 
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
      )
    );
    if (dummyCusts.length > 0) {
      console.log(`Found ${dummyCusts.length} dummy customers in Supabase to delete:`, dummyCusts.map(c => c.name));
      const { error: sbCustDelErr, count } = await supabase
        .from('customers')
        .delete({ count: 'exact' })
        .in('id', dummyCusts.map(c => c.id));
      if (sbCustDelErr) {
        console.error('❌ Supabase customers delete error:', sbCustDelErr.message);
      } else {
        console.log(`✅ Deleted ${count} dummy customers from Supabase.`);
      }
    } else {
      console.log('ℹ️ No matching dummy customers found in Supabase.');
    }
  }

  // 2. VPS DATABASE
  console.log('\n--- Cleaning VPS Database ---');
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
      [TARGET_LEAD_IDS]
    );
    console.log(`✅ Soft-deleted ${vpsLeadCount} dummy leads in VPS.`);

    // Find and delete customers in VPS
    const { rows: vpsCustomers } = await pool.query('SELECT id, name, email FROM customers');
    const dummyVpsCusts = vpsCustomers.filter(c => 
      ['shastika', 'alksdallajh', 'vbmb,', 'ranm'].some(term => 
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
      )
    );

    if (dummyVpsCusts.length > 0) {
      console.log(`Found ${dummyVpsCusts.length} dummy customers in VPS to delete:`, dummyVpsCusts.map(c => c.name));
      const { rowCount: vpsCustDelCount } = await pool.query(
        'DELETE FROM customers WHERE id = ANY($1)',
        [dummyVpsCusts.map(c => c.id)]
      );
      console.log(`✅ Deleted ${vpsCustDelCount} dummy customers from VPS.`);
    } else {
      console.log('ℹ️ No matching dummy customers found in VPS.');
    }

  } catch (err) {
    console.error('❌ VPS DB error:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n🎉 Finished cleaning target leads!');
}

run().catch(console.error);
