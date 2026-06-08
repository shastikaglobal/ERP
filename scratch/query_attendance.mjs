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

async function checkAttendance() {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('date, clock_in')
    .order('date', { ascending: false })
    .limit(10);
    
  console.log(data);
}

checkAttendance();
