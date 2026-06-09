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

async function fix() {
  const vemulaId = '1d1894f1-baa1-4df1-b52d-67faaca45f61';
  const duplicateVemulaId = 'c8f40e32-4adf-4b89-99bb-b6fb2fd8d561';
  const aditiId = '1c5de955-5e21-4409-96d4-f8f0ce43886e';
  
  // 1. Update the original Vemula
  console.log('Updating original Vemula...');
  await supabase.from('profiles').update({
    monthly_salary: 32000,
    joining_date: '2026-06-01'
  }).eq('id', vemulaId);

  // 2. Delete the duplicate Vemula profile and auth user
  console.log('Deleting duplicate Vemula...');
  await supabase.from('profiles').delete().eq('id', duplicateVemulaId);
  await supabase.auth.admin.deleteUser(duplicateVemulaId);

  // 3. Insert attendance for both from June 1 to June 8
  const days = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-08']; // skip Sunday June 7
  
  for (const date of days) {
    // Vemula
    await supabase.from('attendance_logs').upsert({
      employee_id: vemulaId,
      date: date,
      clock_in: `${date}T08:00:00`,
      status: 'present',
      is_manual: true,
      notes: 'Work from home (Manual entry)'
    });
    
    // Aditi
    await supabase.from('attendance_logs').upsert({
      employee_id: aditiId,
      date: date,
      clock_in: `${date}T08:00:00`,
      status: 'present',
      is_manual: true,
      notes: 'Work from home (Manual entry)'
    });
  }

  console.log('Done!');
}
fix();
