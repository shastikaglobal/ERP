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
  const { data: vdata } = await supabase.from('profiles').select('id, full_name, monthly_salary, joining_date').ilike('full_name', '%vemula%');
  console.log('Vemula:', vdata);
  const { data: adata } = await supabase.from('profiles').select('id, full_name, monthly_salary, joining_date').ilike('full_name', '%aditi%');
  console.log('Aditi:', adata);
}
check();
