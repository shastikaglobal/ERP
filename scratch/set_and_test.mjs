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

const adminClient = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const publicClient = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const email = "shastikaglobal11@gmail.com";
  const password = "Shastika@2026";

  console.log(`[1] Listing users to find ID for ${email}...`);
  const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    console.error("List users failed:", listErr);
    return;
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    console.error("User not found!");
    return;
  }
  
  console.log(`[2] Updating password to: ${password}...`);
  const { data, error } = await adminClient.auth.admin.updateUserById(
    user.id,
    { password: password }
  );

  if (error) {
    console.error("Update failed:", error);
    return;
  }
  console.log("Update succeeded!");

  console.log("[3] Attempting login with Shastika@2026...");
  const { data: loginData, error: loginErr } = await publicClient.auth.signInWithPassword({
    email,
    password
  });

  if (loginErr) {
    console.error("Login failed:", loginErr.message);
  } else {
    console.log("Login successful! Session user:", loginData.user.email);
  }
}

run();
