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
    // 1. Delete duplicate 'bde' role for 'ShastikaGlobalImpexPrivateLimited' (user_id: 8dbeed44-5fa8-4e55-8508-e60f4b219dc3)
    const { data: d1, error: e1 } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', '8dbeed44-5fa8-4e55-8508-e60f4b219dc3')
      .eq('role_id', '7429ad12-a8fd-4643-86d9-d4948812fb74'); // 'bde' role id

    if (e1) {
      console.error("Error deleting duplicate role:", e1);
    } else {
      console.log("✅ Successfully deleted duplicate 'bde' role in Supabase!");
    }

    // 2. Delete role for deleted profile 'shastikaglobal 11' (user_id: e08aaf46-3ecd-4d88-a5a0-98915fcb394b)
    const { data: d2, error: e2 } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', 'e08aaf46-3ecd-4d88-a5a0-98915fcb394b');

    if (e2) {
      console.error("Error deleting deleted user's role:", e2);
    } else {
      console.log("✅ Successfully deleted role of deleted profile 'shastikaglobal 11' in Supabase!");
    }

    // 3. Verify user roles again in Supabase
    const { data: userRoles, error: e3 } = await supabase
      .from('user_roles')
      .select('user_id, role_id, roles(slug)')
      .eq('user_id', '8dbeed44-5fa8-4e55-8508-e60f4b219dc3');

    if (e3) throw e3;
    console.log("\nUpdated user_roles for ShastikaGlobalImpexPrivateLimited in Supabase:");
    console.log(userRoles);

  } catch (e) {
    console.error(e);
  }
}

main();
