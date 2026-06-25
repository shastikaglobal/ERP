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
  console.log("Checking user in Supabase Auth...");
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error);
    return;
  }
  
  console.log(`Found ${users.length} users in Supabase Auth:`);
  for (const user of users) {
    console.log(`- Email: ${user.email} | ID: ${user.id} | Confirmed: ${user.email_confirmed_at}`);
  }
  
  const karunya = users.find(u => u.email?.toLowerCase() === 'karunyaajothiprakash@gmail.com');
  if (karunya) {
    console.log("\nFound Karunya!");
    console.log(JSON.stringify(karunya, null, 2));
  } else {
    console.log("\nKarunya NOT found in Supabase Auth!");
  }
}
run();
