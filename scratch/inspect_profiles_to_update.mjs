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

async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, biometric_id, employee_id');
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Profiles list:");
    console.log(JSON.stringify(data, null, 2));
  }
}

listProfiles();
