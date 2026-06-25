import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      return [key, val];
    })
);

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY // Service role key to access auth admin api
);

async function run() {
  const email = "shastikaglobal11@gmail.com";
  console.log(`Checking Supabase auth user for: ${email}`);
  
  // 1. Get all auth users
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error("Error listing auth users:", authErr);
  } else {
    const user = users.find(u => u.email === email);
    if (user) {
      console.log("Auth user found:", JSON.stringify(user, null, 2));
    } else {
      console.log("Auth user NOT found in Supabase Auth.");
      console.log("Available auth users in Supabase:");
      users.forEach(u => console.log(`- ${u.email} (id: ${u.id})`));
    }
  }

  // 2. Get profile from profiles table
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (profileErr) {
    console.error("Error fetching profile:", profileErr);
  } else if (profile) {
    console.log("Profile found in DB:", JSON.stringify(profile, null, 2));
  } else {
    console.log("Profile NOT found in DB.");
    // Let's print some profiles to see what email addresses exist
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, full_name, status, role')
      .limit(10);
    console.log("Recent profiles in database:");
    console.log(JSON.stringify(profiles, null, 2));
  }
}

run();
