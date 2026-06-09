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

async function fix() {
  const empId = 'be3f859f-aaa6-481f-891d-e5ceea3feee9'; // Madhu Mitha
  
  // 08:00:00 IST is 02:30:00 UTC
  const clockInIso = new Date('2026-06-06T08:00:00+05:30').toISOString();
  
  const { data, error } = await supabase.from('attendance_logs').update({
    clock_in: clockInIso,
    is_manual: true,
    notes: 'Recovered missing morning punch'
  }).eq('employee_id', empId).eq('date', '2026-06-06').select();
  
  if (error) {
    console.error(`Error:`, error.message);
  } else {
    console.log(`Successfully fixed June 6th for Madhu Mitha:`, data);
  }
}

fix();
