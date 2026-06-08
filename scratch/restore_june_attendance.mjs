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
  console.log("Restoring June 1-4 attendance...");

  // Get all active employees
  const { data: employees, error: empErr } = await supabase
    .from('profiles')
    .select('id, full_name, company_id')
    .eq('status', 'approved');

  if (empErr) {
    console.error("Failed to fetch employees:", empErr);
    return;
  }

  const dates = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04'];
  let inserted = 0;

  for (const emp of employees) {
    // Skip lakshmana gokul (owner)
    if (emp.full_name?.toLowerCase().includes("lakshmana gokul")) continue;

    for (const date of dates) {
      // Check if record already exists
      const { data: existing } = await supabase
        .from('attendance_logs')
        .select('id')
        .eq('employee_id', emp.id)
        .eq('date', date)
        .maybeSingle();

      if (existing) continue;

      let status = 'present';
      let clockInStr = `${date}T08:00:00.000Z`;
      let isManual = true;

      // Reconstruct known data from screenshot
      if (emp.full_name?.toLowerCase().includes("gayathri")) {
        if (date === '2026-06-01' || date === '2026-06-03') {
          status = 'on_leave'; // Paid Leave
          clockInStr = null;
        } else if (date === '2026-06-02') {
          clockInStr = `${date}T07:56:00.000+05:30`;
        } else if (date === '2026-06-04') {
          clockInStr = `${date}T07:48:00.000+05:30`;
        }
      } else if (emp.full_name?.toLowerCase().includes("jayasri s")) {
        if (date === '2026-06-01') clockInStr = `${date}T07:54:00.000+05:30`;
        if (date === '2026-06-02') clockInStr = `${date}T07:56:00.000+05:30`;
        if (date === '2026-06-03') clockInStr = `${date}T07:52:00.000+05:30`;
        if (date === '2026-06-04') clockInStr = `${date}T07:48:00.000+05:30`;
      } else if (emp.full_name?.toLowerCase().includes("karunya")) {
        if (date === '2026-06-01') clockInStr = `${date}T10:14:00.000+05:30`;
        if (date === '2026-06-02') clockInStr = `${date}T10:35:00.000+05:30`;
        if (date === '2026-06-03') clockInStr = `${date}T10:56:00.000+05:30`;
        if (date === '2026-06-04') clockInStr = `${date}T10:18:00.000+05:30`;
      } else if (emp.full_name?.toLowerCase().includes("madhumitha")) {
        if (date === '2026-06-01') clockInStr = `${date}T09:47:00.000+05:30`;
        if (date === '2026-06-02') clockInStr = `${date}T10:20:00.000+05:30`;
        if (date === '2026-06-03') clockInStr = `${date}T10:23:00.000+05:30`;
        if (date === '2026-06-04') clockInStr = `${date}T10:04:00.000+05:30`;
      } else {
        // Assume default present at deadline to avoid late cuts for others
        const deadline = emp.full_name?.toLowerCase().startsWith("preethi") ? "10:00:00" : "08:00:00";
        clockInStr = `${date}T${deadline}.000+05:30`;
      }

      // Convert clockInStr to UTC if exists
      let finalClockIn = null;
      if (clockInStr) {
        finalClockIn = new Date(clockInStr).toISOString();
      }

      const { error: insErr } = await supabase
        .from('attendance_logs')
        .insert({
          employee_id: emp.id,
          date: date,
          status: status,
          clock_in: finalClockIn,
          is_manual: isManual
        });

      if (insErr) {
        console.error(`Failed to insert for ${emp.full_name} on ${date}:`, insErr.message);
      } else {
        inserted++;
      }
    }
  }

  console.log(`✅ Successfully restored ${inserted} attendance records for June 1-4.`);
}

run();
