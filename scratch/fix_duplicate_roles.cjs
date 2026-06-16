const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Show all user_roles with duplicates
  const { data: allRoles, error } = await supabase
    .from('user_roles')
    .select('id, user_id, role_id, roles(name, slug)')
    .order('user_id');

  if (error) { console.error('Error:', error.message); return; }

  console.log('\n=== ALL USER_ROLES IN SUPABASE ===');
  const byUser = {};
  allRoles.forEach(r => {
    const key = r.user_id;
    if (!byUser[key]) byUser[key] = [];
    byUser[key].push(r);
  });

  let hasDuplicates = false;
  for (const [userId, rows] of Object.entries(byUser)) {
    const roleNames = rows.map(r => r.roles?.slug || r.role_id);
    if (rows.length > 1) {
      hasDuplicates = true;
      console.log(`  ⚠️  DUPLICATE userId=${userId} → [${roleNames.join(', ')}] (${rows.length} rows)`);
    } else {
      console.log(`  ✅ userId=${userId.slice(0,8)}... → ${roleNames[0]}`);
    }
  }

  if (!hasDuplicates) {
    console.log('\n✅ No duplicates found!');
    return;
  }

  console.log('\n=== CLEANING UP DUPLICATES ===');
  // For each user with duplicates, keep only the LAST row (most recently added) and delete the rest
  for (const [userId, rows] of Object.entries(byUser)) {
    if (rows.length <= 1) continue;
    const keepRole = rows[rows.length - 1]?.roles?.slug;
    const toDelete = rows.slice(0, -1).map(r => r.id);
    console.log(`  Fixing userId=${userId.slice(0,8)}...: keeping '${keepRole}', deleting ${toDelete.length} old rows...`);
    const { error: delErr } = await supabase.from('user_roles').delete().in('id', toDelete);
    if (delErr) console.error(`  ❌ Error: ${delErr.message}`);
    else console.log(`  ✅ Done!`);
  }

  console.log('\n✅ Cleanup complete!');
}

run().catch(console.error);
