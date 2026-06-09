import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = 'd:/ERP1/ERP/.env';
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/"/g, '').replace(/\r/, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/"/g, '').replace(/\r/, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name, monthly_salary, punch_deadline')
    .ilike('full_name', '%nethra%');
  
  if (pErr) console.error(pErr);
  else console.log('Profiles:', profiles);

  if (profiles && profiles.length > 0) {
    const empId = profiles[0].id;
    const { data: logs, error: lErr } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', empId)
      .order('date', { ascending: true });
    
    if (lErr) console.error(lErr);
    else console.log('Logs for Nethra:', logs);
  }
}

check();
