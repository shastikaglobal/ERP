import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').map(line => line.split('=').map(str => str.trim().replace(/"/g, ''))));

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('emails').select('status, delivered_at, error_message').limit(1);
  console.log("Error:", error);
}

run();
