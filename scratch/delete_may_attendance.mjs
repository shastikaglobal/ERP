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

async function run() {
  console.log("Deleting attendance logs before 2026-06-01...");
  
  // Also getting the exact counts before
  const { data: bData } = await supabase.from('attendance_logs').select('id').lt('date', '2026-06-01');
  console.log(`Found ${bData?.length} records to delete.`);
  
  const { data, error, count } = await supabase
    .from('attendance_logs')
    .delete()
    .lt('date', '2026-06-01');

  if (error) {
    console.error("Error deleting data:", error);
  } else {
    console.log(`Successfully deleted dummy records from May (and before).`);
  }
}

run();
