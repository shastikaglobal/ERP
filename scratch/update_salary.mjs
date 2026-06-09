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
  const { data, error } = await supabase
    .from('profiles')
    .update({ monthly_salary: 12000 })
    .eq('id', 'be3f859f-aaa6-481f-891d-e5ceea3feee9')
    .select();
    
  console.log('Updated:', data, error);
}
fix();
