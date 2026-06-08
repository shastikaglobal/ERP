import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;

async function clearClockOuts() {
  console.log(`Clearing all clock_out times for ${dateStr}...`);
  
  const { data, error } = await supabase
    .from('attendance_logs')
    .update({ clock_out: null })
    .eq('date', dateStr)
    .not('clock_out', 'is', null);

  if (error) {
    console.error("❌ Failed to clear clock outs:", error.message);
  } else {
    console.log("✅ Successfully cleared all incorrect punch outs for today!");
  }
}

clearClockOuts();
