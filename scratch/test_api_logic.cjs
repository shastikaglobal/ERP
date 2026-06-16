require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('=== Testing /api/employees logic (Supabase profiles) ===');
  const { data: employees, error: empErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, requested_role, department, is_active, status')
    .eq('status', 'approved')
    .eq('is_deleted', false)
    .order('full_name');
  
  if (empErr) {
    console.error('ERROR:', empErr.message);
  } else {
    console.log(`Found ${employees.length} approved employees:`);
    employees.forEach(e => console.log(` - ${e.full_name} (${e.requested_role})`));
  }

  console.log('\n=== Testing /api/employees/all/profiles logic ===');
  const { data: allProfiles, error: allErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, requested_role, status, rejection_reason, created_at, department, is_active')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  
  if (allErr) {
    console.error('ERROR:', allErr.message);
  } else {
    console.log(`Found ${allProfiles.length} total profiles`);
    allProfiles.slice(0,3).forEach(p => console.log(` - ${p.full_name} | status: ${p.status} | role: ${p.requested_role}`));
  }

  console.log('\n=== Testing roles table (for one-role-per-person) ===');
  const { data: roles, error: rolesErr } = await supabase
    .from('roles')
    .select('id, slug, name');
  if (rolesErr) {
    console.error('ERROR:', rolesErr.message);
  } else {
    console.log('Available roles:');
    roles.forEach(r => console.log(` - ${r.slug} => ${r.id}`));
  }
}

main().catch(console.error);
