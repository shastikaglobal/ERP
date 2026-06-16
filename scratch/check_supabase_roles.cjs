const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxebygxpjzntogzpjnga.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('user_id, role_id, roles(slug)')
      .eq('user_id', '8dbeed44-5fa8-4e55-8508-e60f4b219dc3'); // ShastikaGlobalImpexPrivateLimited

    if (error) throw error;
    console.log("Supabase user_roles for ShastikaGlobalImpexPrivateLimited:");
    console.log(userRoles);

    // Let's also fetch ALL rows from user_roles in Supabase
    const { data: allUserRoles, error: err2 } = await supabase
      .from('user_roles')
      .select('user_id, role_id, roles(slug)');
    if (err2) throw err2;
    console.log("\nAll Supabase user_roles rows count:", allUserRoles.length);
    console.log("All Supabase user_roles rows:");
    allUserRoles.forEach(r => {
      console.log(`user_id: ${r.user_id} | role_id: ${r.role_id} | slug: ${r.roles?.slug}`);
    });

  } catch (e) {
    console.error(e);
  }
}

main();
