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
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const userId = 'e08aaf46-3ecd-4d88-a5a0-98915fcb394b';
  console.log(`Fetching user details for ID: ${userId}`);
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("User details:", JSON.stringify(data.user, null, 2));
  }
}

check();
