import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

// MUST use the service_role key to bypass RLS and use auth.admin
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAllPasswords() {
  const DEFAULT_PASSWORD = "Password@123";

  console.log("Fetching all users from profiles...");
  
  const { data: profiles, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email');
    
  if (profErr) {
    console.error("Error fetching profiles:", profErr);
    return;
  }

  console.log(`Found ${profiles.length} users. Resetting their passwords to: ${DEFAULT_PASSWORD}`);

  let successCount = 0;
  let failCount = 0;

  for (const user of profiles) {
    if (!user.id) continue;
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: DEFAULT_PASSWORD,
    });

    if (error) {
      console.error(`❌ Failed to reset password for ${user.email || user.full_name}:`, error.message);
      failCount++;
    } else {
      console.log(`✅ Reset password for: ${user.email || user.full_name}`);
      successCount++;
    }
  }

  console.log(`\n--- SUMMARY ---`);
  console.log(`Successfully reset: ${successCount} users`);
  console.log(`Failed to reset: ${failCount} users`);
  console.log(`The new password for everyone is: ${DEFAULT_PASSWORD}`);
}

resetAllPasswords();
