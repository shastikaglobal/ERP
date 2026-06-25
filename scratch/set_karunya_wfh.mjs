import { createClient } from '@supabase/supabase-js';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log("Updating karunya profile to system_mode = 'wfh'...");
  const { data, error } = await supabase
    .from('profiles')
    .update({ system_mode: 'wfh' })
    .eq('id', '59df2897-02e4-4ab3-80ba-dc016642ba04')
    .select();
  
  if (error) {
    console.error("Supabase Error:", error.message);
  } else {
    console.log("Supabase Profile Updated:", data);
  }
}

main();
