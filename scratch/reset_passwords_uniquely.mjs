import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function resetPasswordsUniquely() {
  console.log("Fetching all users from profiles...");
  
  const { data: profiles, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email');
    
  if (profErr) {
    console.error("Error fetching profiles:", profErr);
    return;
  }

  console.log(`Found ${profiles.length} users. Setting unique passwords...`);
  console.log("--------------------------------------------------");

  let successCount = 0;
  const passwordList = [];

  for (const user of profiles) {
    if (!user.id) continue;
    
    // Determine the base string for the password
    let baseStr = "";
    if (user.full_name && user.full_name.trim().length > 0) {
      // Use the first word of their full name
      baseStr = user.full_name.trim().split(/\s+/)[0];
    } else if (user.email) {
      // Fallback to email prefix
      baseStr = user.email.split('@')[0];
    } else {
      baseStr = "User";
    }

    // Clean up base string: remove special characters, capitalize first letter
    baseStr = baseStr.replace(/[^a-zA-Z0-9]/g, '');
    if (baseStr.length === 0) baseStr = "User";
    
    const capitalizedBase = baseStr.charAt(0).toUpperCase() + baseStr.slice(1).toLowerCase();
    
    // Create password like "Gayathri@123"
    const uniquePassword = `${capitalizedBase}@123`;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: uniquePassword,
    });

    if (error) {
      console.error(`❌ Failed for ${user.email || user.full_name}:`, error.message);
    } else {
      console.log(`✅ ${user.full_name?.padEnd(25) || user.email?.padEnd(25)} -> ${uniquePassword}`);
      passwordList.push({ name: user.full_name || user.email, password: uniquePassword });
      successCount++;
    }
  }

  console.log("--------------------------------------------------");
  console.log(`Successfully reset passwords for ${successCount} users to unique values!`);
}

resetPasswordsUniquely();
