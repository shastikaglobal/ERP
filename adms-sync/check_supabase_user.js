const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

let dir = __dirname;
let envPath;
while (dir) {
  const check = path.join(dir, '.env');
  if (fs.existsSync(check)) {
    envPath = check;
    break;
  }
  const parent = path.dirname(dir);
  if (parent === dir) break;
  dir = parent;
}
if (envPath) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Checking Supabase Auth users...');
  
  // Get user by email shastikaglobal11@gmail.com
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error('Error listing users from Supabase Auth:', usersErr);
    return;
  }

  const matches = usersData.users.filter(u => u.email.includes('shastikaglobal11') || u.email.includes('ramragul'));
  console.log('Matching auth users in Supabase Auth:');
  console.log(JSON.stringify(matches.map(u => ({ id: u.id, email: u.email, last_sign_in_at: u.last_sign_in_at })), null, 2));

  // Check profiles table in Supabase
  console.log('\nChecking Supabase profiles table...');
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status, is_active, is_deleted')
    .or('email.ilike.%shastikaglobal11%,email.ilike.%ramragul%');
  
  if (profErr) {
    console.error('Error querying profiles table in Supabase:', profErr);
  } else {
    console.log(JSON.stringify(profiles, null, 2));
  }

  // Check user_roles table in Supabase
  console.log('\nChecking Supabase user_roles table...');
  const { data: userRoles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('user_id, role_id, roles(slug, name)')
    .in('user_id', ['e08aaf46-3ecd-4d88-a5a0-98915fcb394b', '9bb2978e-29a7-42f8-8420-7ab8fe45cd9c']);

  if (rolesErr) {
    console.error('Error querying user_roles table in Supabase:', rolesErr);
  } else {
    console.log(JSON.stringify(userRoles, null, 2));
  }
}

main().catch(console.error);
