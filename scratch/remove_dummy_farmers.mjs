import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
const envPath = resolve(process.cwd(), '.env');
const envText = readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envText.split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, '')];
    })
);

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Farmers to remove — exact full_name matches
const DUMMY_NAMES = [
  'kani',
  'SWATHI TEST',
  'kim.swathi',
  'pavish',
  'Exporters',
];

console.log('🔍 Fetching dummy farmers from Supabase...\n');

// First: show what we will delete
const { data: toDelete, error: fetchErr } = await supabase
  .from('farmers')
  .select('id, full_name, phone, is_active, is_deleted')
  .in('full_name', DUMMY_NAMES);

if (fetchErr) {
  console.error('❌ Fetch error:', fetchErr.message);
  process.exit(1);
}

if (!toDelete || toDelete.length === 0) {
  console.log('✅ No dummy farmers found — already clean!');
  process.exit(0);
}

console.log(`Found ${toDelete.length} dummy farmer(s) to remove:`);
toDelete.forEach(f => {
  console.log(`  - [${f.id}] "${f.full_name}" | active=${f.is_active} | deleted=${f.is_deleted}`);
});

// Soft-delete: set is_deleted=true, is_active=false
const ids = toDelete.map(f => f.id);
const { error: deleteErr } = await supabase
  .from('farmers')
  .update({ is_deleted: true, is_active: false, updated_at: new Date().toISOString() })
  .in('id', ids);

if (deleteErr) {
  console.error('❌ Delete error:', deleteErr.message);
  process.exit(1);
}

console.log(`\n✅ Successfully soft-deleted ${ids.length} dummy farmer(s) from Supabase!`);

// Also check if they have associated customers rows (from conversion)
const { data: linkedCustomers } = await supabase
  .from('customers')
  .select('id, name, farmer_id')
  .in('farmer_id', ids);

if (linkedCustomers && linkedCustomers.length > 0) {
  console.log(`\n⚠️  Found ${linkedCustomers.length} customer record(s) linked to these farmers:`);
  linkedCustomers.forEach(c => console.log(`  - "${c.name}" (customer id: ${c.id})`));
  console.log('  These customer records were NOT deleted (they may be real). Delete manually if needed.');
} else {
  console.log('ℹ️  No linked customer records found.');
}

console.log('\nDone! The farmers list and convert page will no longer show these entries.');
