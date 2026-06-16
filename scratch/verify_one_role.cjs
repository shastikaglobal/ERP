require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log('=== Current user_roles (should be 1 per user) ===\n');

  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select('user_id, role_id, assigned_at, roles(slug, name)')
    .order('assigned_at', { ascending: false });

  if (error) { console.error('Error:', error.message); return; }

  // Group by user
  const byUser = {};
  for (const ur of userRoles) {
    if (!byUser[ur.user_id]) byUser[ur.user_id] = [];
    byUser[ur.user_id].push(ur.roles?.slug);
  }

  // Get profile names
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, requested_role');
  const profileMap = {};
  for (const p of profiles) profileMap[p.id] = p;

  let hasMultiple = false;
  for (const [uid, roles] of Object.entries(byUser)) {
    const p = profileMap[uid];
    const status = roles.length > 1 ? '❌ MULTIPLE' : '✅';
    console.log(`${status} ${p?.full_name || uid}: [${roles.join(', ')}] (requested: ${p?.requested_role})`);
    if (roles.length > 1) hasMultiple = true;
  }

  if (!hasMultiple) {
    console.log('\n✅ All users have exactly ONE role. One-role-per-person enforced!');
  } else {
    console.log('\n❌ Some users still have multiple roles!');
  }
}

verify().catch(console.error);
