require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMultipleRoles() {
  console.log('=== Fixing: One Person = One Role ===\n');

  // 1. Find all users with multiple roles
  const { data: allUserRoles, error: urErr } = await supabase
    .from('user_roles')
    .select('user_id, role_id, assigned_at, roles(slug, name)')
    .order('assigned_at', { ascending: false });
  if (urErr) throw urErr;

  // Group by user_id
  const byUser = {};
  for (const ur of allUserRoles) {
    if (!byUser[ur.user_id]) byUser[ur.user_id] = [];
    byUser[ur.user_id].push(ur);
  }

  // 2. Fetch profiles to get requested_role (the correct/intended role)
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, requested_role');
  if (profErr) throw profErr;
  const profileMap = {};
  for (const p of profiles) profileMap[p.id] = p;

  let fixed = 0;
  let skipped = 0;

  for (const [userId, roles] of Object.entries(byUser)) {
    if (roles.length <= 1) {
      skipped++;
      continue; // Already fine
    }

    const profile = profileMap[userId];
    const requestedRole = profile?.requested_role;
    const name = profile?.full_name || userId;

    console.log(`⚠️  ${name} has ${roles.length} roles: ${roles.map(r => r.roles?.slug).join(', ')}`);

    // Determine which role to keep:
    // Priority: matches requested_role in profile > most recently assigned
    let keepRoleId = null;
    if (requestedRole) {
      const match = roles.find(r => r.roles?.slug === requestedRole);
      if (match) keepRoleId = match.role_id;
    }
    // Fallback: keep most recently assigned (first in list since sorted desc)
    if (!keepRoleId) keepRoleId = roles[0].role_id;

    const keepRole = roles.find(r => r.role_id === keepRoleId);
    console.log(`   → Keeping: ${keepRole?.roles?.slug} (matches requested_role: ${requestedRole})`);

    // Delete all OTHER roles for this user
    const roleIdsToDelete = roles
      .filter(r => r.role_id !== keepRoleId)
      .map(r => r.role_id);

    for (const roleIdToDelete of roleIdsToDelete) {
      const delRole = roles.find(r => r.role_id === roleIdToDelete);
      const { error: delErr } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleIdToDelete);
      if (delErr) {
        console.error(`   ❌ Failed to delete role ${delRole?.roles?.slug}:`, delErr.message);
      } else {
        console.log(`   ✅ Removed extra role: ${delRole?.roles?.slug}`);
      }
    }
    fixed++;
  }

  console.log(`\n=== Done ===`);
  console.log(`Fixed: ${fixed} users with multiple roles`);
  console.log(`Already OK: ${skipped} users`);

  // 3. Show final state
  console.log('\n=== Final user_roles state ===');
  const { data: finalRoles } = await supabase
    .from('user_roles')
    .select('user_id, roles(slug), profiles(full_name)')
    .order('user_id');
  
  for (const r of (finalRoles || [])) {
    console.log(` - ${r.profiles?.full_name || r.user_id}: ${r.roles?.slug}`);
  }
}

fixMultipleRoles().catch(console.error);
