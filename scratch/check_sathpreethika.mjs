import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

const env = dotenv.parse(readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // 1. Fetch profile for sathpreethika
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, biometric_id, monthly_salary, punch_deadline')
    .ilike('full_name', '%sathpreethika%');

  console.log("Profiles matching 'sathpreethika':", profiles, profErr);

  if (profiles && profiles.length > 0) {
    const empId = profiles[0].id;
    // 2. Fetch today's log (2026-06-01)
    const { data: logs, error: logsErr } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', empId)
      .eq('date', '2026-06-01');

    console.log("Logs for today:", logs, logsErr);
  }
}
run();
