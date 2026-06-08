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

async function undoManualEntry() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`; // 2026-06-06

  console.log(`Undoing my automated inserts for ${dateStr}...`);

  const { data, error } = await supabase
    .from('attendance_logs')
    .delete()
    .eq('date', dateStr)
    .eq('notes', 'Manual entry for today')
    .select();

  if (error) {
    console.error("Failed to undo:", error.message);
  } else {
    console.log(`✅ Successfully deleted ${data.length} records that I mistakenly inserted.`);
  }
}

undoManualEntry();
