import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read environment variables
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
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

const adminClient = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const publicClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const targetEmail = "sathpreethika5@gmail.com";
  const targetId = "1020";
  const newPassword = "TestPassword120!";

  console.log(`[1] Generating reset link for ${targetEmail}...`);
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: targetEmail,
    options: {
      redirectTo: 'http://localhost:8080/auth/callback?type=recovery'
    }
  });

  if (linkErr) {
    console.error("Failed to generate link:", linkErr.message);
    return;
  }

  const actionLink = linkData.properties.action_link;
  console.log("Action Link generated successfully:", actionLink);

  console.log("[2] Simulating browser click / redirection on action link...");
  // Use node-fetch with redirect: 'manual' to catch the redirect URL containing tokens/code
  const response = await fetch(actionLink, {
    method: 'GET',
    redirect: 'manual'
  });

  const redirectUrl = response.headers.get('location');
  console.log("Redirected Location:", redirectUrl);

  if (!redirectUrl) {
    console.error("No redirect location header found!");
    return;
  }

  // The redirect URL can be of two forms:
  // 1. http://localhost:8080/auth/callback?type=recovery#access_token=...&refresh_token=... (implicit)
  // 2. http://localhost:8080/auth/callback?type=recovery&code=... (PKCE)
  const urlObj = new URL(redirectUrl.replace('#', '?'));
  const accessToken = urlObj.searchParams.get('access_token');
  const refreshToken = urlObj.searchParams.get('refresh_token');
  const code = urlObj.searchParams.get('code');

  let sessionData = null;

  if (code) {
    console.log("[3] Exchanging PKCE code for session...");
    const { data: exchangeData, error: exchangeErr } = await publicClient.auth.exchangeCodeForSession(code);
    if (exchangeErr) {
      console.error("Exchange code failed:", exchangeErr.message);
      return;
    }
    sessionData = exchangeData.session;
  } else if (accessToken && refreshToken) {
    console.log("[3] Setting session from hash tokens...");
    const { data: setData, error: setErr } = await publicClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (setErr) {
      console.error("Set session failed:", setErr.message);
      return;
    }
    sessionData = setData.session;
  } else {
    console.error("Could not extract session tokens or code from redirect URL!");
    return;
  }

  console.log("Session established successfully! User email:", sessionData.user.email);

  // Use the established session to update the user's password
  const employeeSessionClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false
    }
  });
  
  await employeeSessionClient.auth.setSession({
    access_token: sessionData.access_token,
    refresh_token: sessionData.refresh_token
  });

  console.log(`[4] Updating password to "${newPassword}" under the new employee session...`);
  const { error: updateErr } = await employeeSessionClient.auth.updateUser({
    password: newPassword
  });

  if (updateErr) {
    console.error("Update password failed:", updateErr.message);
    return;
  }
  console.log("Password updated successfully!");

  // Now, try logging in with ID "1020" and the new password, just like the login form does
  console.log(`[5] Simulating login with ID "${targetId}" and password "${newPassword}"...`);
  // Look up email by ID
  const { data: profile, error: profileErr } = await publicClient
    .from('profiles')
    .select('email')
    .or(`employee_id.eq.${targetId},biometric_id.eq.${targetId}`)
    .maybeSingle();

  if (profileErr || !profile) {
    console.error("Profile lookup failed:", profileErr?.message || "Not found");
    return;
  }

  console.log(`Found email for ID "${targetId}":`, profile.email);

  const { data: loginData, error: loginErr } = await publicClient.auth.signInWithPassword({
    email: profile.email,
    password: newPassword
  });

  if (loginErr) {
    console.error("Login failed:", loginErr.message);
  } else {
    console.log(`✅ SUCCESS! Logged in successfully as: ${loginData.user.email}`);
  }
}

run().catch(console.error);
