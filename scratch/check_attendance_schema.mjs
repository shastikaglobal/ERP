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
  const { data, error } = await supabase.from('attendance_logs').select('*').limit(1);
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log('No data or error:', error);
  }
}
check();
