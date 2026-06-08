import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttLogs() {
  console.log("Fetching logs from AttLogs for June 2026...");
  
  const { data, error } = await supabase
    .from('AttLogs')
    .select('*')
    .gte('LogDateTime', '2026-06-01')
    .lt('LogDateTime', '2026-06-05');

  if (error) {
    console.error("Error fetching AttLogs:", error);
    return;
  }

  console.log(`Found ${data.length} records in AttLogs for June 1st - 4th!`);
  if (data.length > 0) {
    console.log("First 5 records:", data.slice(0, 5));
  }
}

checkAttLogs();
