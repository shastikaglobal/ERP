import { createClient } from '@supabase/supabase-js';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = dotenvConfig.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Listing existing Supabase Auth users to reset passwords...");
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    return;
  }
  
  console.log(`Found ${users.length} users to update.`);
  
  for (const user of users) {
    const email = user.email;
    console.log(`Resetting password for: ${email} (ID: ${user.id})...`);
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        password: 'Welcome@Shastika2026'
      });
      if (error) {
        console.error(`❌ Failed to reset password for ${email}:`, error.message);
      } else {
        console.log(`✅ Successfully reset password for ${email}`);
      }
    } catch (err) {
      console.error(`❌ Exception resetting password for ${email}:`, err.message);
    }
  }
  console.log("All passwords reset successfully!");
}

run().catch(console.error);
