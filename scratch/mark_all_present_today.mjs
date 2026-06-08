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

async function markAllPresent() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`; // 2026-06-06
  
  // Set clock-in to 9:30 AM local time
  const clockInTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30, 0);

  console.log(`Fetching all employee profiles...`);
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, company_id');
  
  if (profErr) {
    console.error("Error fetching profiles:", profErr);
    return;
  }

  console.log(`Found ${profiles.length} profiles. Marking them present for ${dateStr}...`);

  let count = 0;
  for (const emp of profiles) {
    // Check if attendance already exists
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('employee_id', emp.id)
      .eq('date', dateStr);

    if (error) {
      console.error("Select error:", error);
      continue;
    }

    if (!data || data.length === 0) {
      const { error: insErr } = await supabase.from('attendance_logs').insert({
        employee_id: emp.id,
        date: dateStr,
        status: 'present',
        clock_in: clockInTime.toISOString(),
        is_manual: true,
        notes: 'Manual entry for today'
      });
      if (!insErr) {
        count++;
      } else {
        console.error("Insert error for", emp.id, ":", insErr);
      }
    }
  }

  console.log(`✅ Successfully marked ${count} employees as present today at 09:30 AM!`);
}

markAllPresent();
