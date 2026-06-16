require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fix: user_roles should match profiles.requested_role (source of truth is requested_role)
async function fixMismatches() {
  console.log('=== Fixing role mismatches (user_roles vs profiles.requested_role) ===\n');

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, requested_role')
    .eq('status', 'approved')
    .eq('is_deleted', false);
  if (profErr) throw profErr;

  const { data: allRoles, error: rolesErr } = await supabase
    .from('roles')
    .select('id, slug');
  if (rolesErr) throw rolesErr;
  const roleSlugToId = {};
  for (const r of allRoles) roleSlugToId[r.slug] = r.id;

  const { data: userRoles, error: urErr } = await supabase
    .from('user_roles')
    .select('user_id, role_id, roles(slug)');
  if (urErr) throw urErr;
  const userRoleMap = {};
  for (const ur of userRoles) userRoleMap[ur.user_id] = ur;

  let fixed = 0;
  for (const profile of profiles) {
    const currentUserRole = userRoleMap[profile.id];
    const currentSlug = currentUserRole?.roles?.slug;
    const expectedSlug = profile.requested_role;

    if (!expectedSlug) {
      console.log(`⚠️  ${profile.full_name}: no requested_role set — skipping`);
      continue;
    }
    if (currentSlug === expectedSlug) {
      console.log(`✅ ${profile.full_name}: ${currentSlug} (OK)`);
      continue;
    }

    console.log(`🔧 ${profile.full_name}: user_roles=${currentSlug || 'none'} → fixing to ${expectedSlug}`);
    const newRoleId = roleSlugToId[expectedSlug];
    if (!newRoleId) {
      console.warn(`   ❌ Role slug '${expectedSlug}' not found in roles table`);
      continue;
    }

    // Delete existing user_roles for this user
    await supabase.from('user_roles').delete().eq('user_id', profile.id);
    // Insert correct one
    const { error: insertErr } = await supabase.from('user_roles').insert({
      user_id: profile.id,
      role_id: newRoleId,
      assigned_at: new Date().toISOString()
    });
    if (insertErr) {
      console.error(`   ❌ Insert failed:`, insertErr.message);
    } else {
      console.log(`   ✅ Fixed: ${profile.full_name} → ${expectedSlug}`);
      fixed++;
    }
  }

  console.log(`\n=== Done. Fixed ${fixed} mismatches ===`);
}

fixMismatches().catch(console.error);
