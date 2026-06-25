import { createClient } from '@supabase/supabase-js';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log("Signing in as karunyaajothiprakash@gmail.com with anon key...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'karunyaajothiprakash@gmail.com',
    password: 'Karunya@123'
  });
  
  if (authErr) {
    console.error("Login failed:", authErr.message);
    return;
  }
  
  console.log("Logged in. Querying profiles table...");
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'approved')
    .eq('is_deleted', false)
    .order('full_name');
    
  if (profErr) {
    console.error("Error fetching profiles:", profErr.message);
  } else {
    console.log(`Success! Fetched ${profiles.length} profiles.`);
    profiles.forEach(p => {
      console.log(`- ${p.full_name} (system_mode: ${p.system_mode})`);
    });
  }
}

main();
