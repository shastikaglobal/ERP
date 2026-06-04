import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ override: true });

const env = dotenv.parse(readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SHARED_COMPANY_ID = '00000000-0000-0000-0000-00000000ae01';

async function processNarmatha() {
  console.log("Looking for Narmatha...");
  
  // Try to find if she exists first
  const { data: existing, error: err } = await supabase
    .from('profiles')
    .select('id, full_name, biometric_id')
    .ilike('full_name', '%narmatha%');

  if (err) {
    console.error("Error querying profiles:", err.message);
    return;
  }

  if (existing && existing.length > 0) {
    console.log(`Found ${existing.length} existing record(s) for Narmatha.`);
    const userId = existing[0].id;
    console.log(`Updating biometric_id for ${existing[0].full_name} (${userId}) to 1015...`);
    
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ biometric_id: '1015' })
      .eq('id', userId);
      
    if (updateErr) {
      console.error("❌ Failed to update profile:", updateErr.message);
    } else {
      console.log("✅ Successfully updated Narmatha's biometric ID to 1015.");
    }
  } else {
    console.log("Narmatha not found. Creating a new user...");
    const email = 'narmatha@example.com'; // Placeholder
    const password = Math.random().toString(36).slice(-12) + 'A1!';
    
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Narmatha',
        company_id: SHARED_COMPANY_ID
      }
    });

    if (authErr) {
      console.error("❌ Failed to create auth user:", authErr.message);
      return;
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created successfully. ID: ${userId}`);

    await new Promise(r => setTimeout(r, 1000));

    const { error: profErr } = await supabase
      .from('profiles')
      .update({
        full_name: 'Narmatha',
        biometric_id: '1015',
        requested_role: 'bde', // Assuming BDE by default, can be changed later
        status: 'approved',
        company_id: SHARED_COMPANY_ID,
        is_active: true
      })
      .eq('id', userId);

    if (profErr) {
      console.error("❌ Failed to update profile:", profErr.message);
      return;
    }
    console.log("✅ Profile created successfully with Biometric ID 1015.");
  }
}

processNarmatha();
