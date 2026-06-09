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

async function run() {
  const vemulaId = '1d1894f1-baa1-4df1-b52d-67faaca45f61';
  const aditiId = '1c5de955-5e21-4409-96d4-f8f0ce43886e';

  console.log('Setting system_mode to wfh...');
  const { error: vErr } = await supabase.from('profiles').update({ system_mode: 'wfh' }).eq('id', vemulaId);
  const { error: aErr } = await supabase.from('profiles').update({ system_mode: 'wfh' }).eq('id', aditiId);

  if (vErr || aErr) {
    console.error('Error:', vErr || aErr);
  } else {
    console.log('Success!');
  }
}
run();
