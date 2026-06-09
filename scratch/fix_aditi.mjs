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

async function fixAditi() {
  const aditiId = '1c5de955-5e21-4409-96d4-f8f0ce43886e';
  
  console.log('Updating Aditi joining date to June 8...');
  await supabase.from('profiles').update({
    joining_date: '2026-06-08'
  }).eq('id', aditiId);

  console.log('Deleting Aditi attendance records before June 8...');
  const daysToDelete = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06'];
  
  for (const date of daysToDelete) {
    await supabase.from('attendance_logs').delete().match({ employee_id: aditiId, date: date });
  }

  console.log('Done fixing Aditi!');
}
fixAditi();
