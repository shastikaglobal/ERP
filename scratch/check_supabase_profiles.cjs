require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Check profiles table columns
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  if (profErr) {
    console.error('profiles error:', profErr.message);
  } else {
    console.log('=== Supabase profiles sample ===');
    console.log(JSON.stringify(profiles, null, 2));
  }

  // Check user_roles table
  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('*')
    .limit(10);

  if (rolesErr) {
    console.error('user_roles error:', rolesErr.message);
  } else {
    console.log('\n=== user_roles sample ===');
    console.log(JSON.stringify(roles, null, 2));
  }

  // Check user_permissions table
  const { data: perms, error: permsErr } = await supabase
    .from('user_permissions')
    .select('*')
    .limit(5);

  if (permsErr) {
    console.error('user_permissions error:', permsErr.message);
  } else {
    console.log('\n=== user_permissions sample ===');
    console.log(JSON.stringify(perms, null, 2));
  }
}

main().catch(console.error);
