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
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'approved')
    .eq('is_deleted', false)
    .order('full_name');
  
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Approved ProfilesCount:", data.length);
    console.log("Profiles details:");
    data.forEach(p => {
      console.log(`- ${p.full_name} (${p.email}): id=${p.id}, system_mode=${p.system_mode}, status=${p.status}`);
    });
  }
}

main();
