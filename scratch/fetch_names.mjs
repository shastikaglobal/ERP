import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchNames() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error(error);
  } else {
    data.forEach(p => console.log(`${p.id} | ${p.full_name || p.name || p.email} | Biometric: ${p.biometric_id}`));
  }
}
fetchNames();
