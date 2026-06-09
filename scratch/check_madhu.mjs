import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = 'd:/ERP1/ERP/.env';
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/"/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/"/g, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, biometric_id').ilike('full_name', '%Madhu%');
  console.log('Profiles:', data);

  if (data && data.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const { data: logs } = await supabase.from('attendance_logs').select('*').eq('employee_id', data[0].id).eq('date', today);
    console.log('Logs for today:', logs);
  }
}
check();
