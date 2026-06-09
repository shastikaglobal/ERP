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
  const days = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05'];
  
  for (const date of days) {
    // 08:00:00 IST is 02:30:00 UTC
    const clockInIso = new Date(`${date}T08:00:00+05:30`).toISOString();
    
    const { data, error } = await supabase.from('attendance_logs').upsert({
      employee_id: empId,
      date: date,
      clock_in: clockInIso,
      status: 'present',
      is_manual: true,
      notes: 'Recovered missing punch'
    }, { onConflict: 'employee_id,date' }).select();
    
    if (error) {
      console.error(`Error on ${date}:`, error.message);
    } else {
      console.log(`Successfully marked present for ${date}`);
    }
  }
}

fix();
