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

// Admin client to update the password
const adminClient = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Client-side public client to test the login
const publicClient = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const email = "shastikaglobal11@gmail.com";
  const testPassword = "NewPassword@123456";

  console.log(`[1] Listing auth users to find ID for ${email}...`);
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
  console.log(`User found. ID: ${user.id}`);

  console.log(`[2] Updating password to: ${testPassword}...`);
  const { data: updateData, error: updateErr } = await adminClient.auth.admin.updateUserById(
    user.id,
    { password: testPassword }
  );

  if (updateErr) {
    console.error("Failed to update password:", updateErr);
    return;
  }
  console.log("Password updated successfully!");

  console.log("[3] Attempting login with new password...");
  const { data: loginData, error: loginErr } = await publicClient.auth.signInWithPassword({
    email,
    password: testPassword
  });

  if (loginErr) {
    console.error("Login failed with new password:", loginErr.message, loginErr);
  } else {
    console.log("Login successful! Access token prefix:", loginData.session.access_token.substring(0, 20));
  }
}

run();
