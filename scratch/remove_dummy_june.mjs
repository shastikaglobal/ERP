import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const dates = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04'];
  
  // Delete the dummy data I inserted (where it's exactly 08:00 or 10:00 on the dot)
  // Or just delete all is_manual = true for these dates to clean up
  const { error } = await supabase
    .from('attendance_logs')
    .delete()
    .in('date', dates)
    .eq('is_manual', true);

  if (error) console.error(error);
  else console.log("Removed dummy data.");
}

run();
