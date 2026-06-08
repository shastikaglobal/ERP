import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = 'd:/ERP1/ERP/.env';
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of envLines) {
  if (line.includes('VITE_SUPABASE_URL=')) supabaseUrl = line.split('VITE_SUPABASE_URL=')[1].trim().replace(/"/g, '').replace(/'/g, '');
  if (line.includes('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('SUPABASE_SERVICE_ROLE_KEY=')[1].trim().replace(/"/g, '').replace(/'/g, '');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) console.error('Error:', error);
  else {
    console.log('Recent punches:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkLogs();
