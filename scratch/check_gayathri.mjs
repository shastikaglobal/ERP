import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: profiles } = await supabase.from('profiles').select('*').eq('full_name', 'Gayathri');
  const gayathri = profiles[0];

  const { data: logs } = await supabase.from('attendance_logs').select('*').eq('employee_id', gayathri.id);
  console.log("Gayathri logs:", logs);
}

main();
