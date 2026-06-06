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
  const today = new Date().toISOString().split('T')[0]; // Gets 2026-06-06
  
  console.log(`\n📅 Fetching Attendance for Today (${today})...\n`);

  const { data: attendanceData, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('date', today)
    .order('clock_in', { ascending: true });

  if (error) {
    console.error("❌ Error fetching attendance:", error.message);
    return;
  }

  if (!attendanceData || attendanceData.length === 0) {
    console.log("No attendance records found for today.");
    return;
  }

  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, biometric_id');

  console.log("Raw Attendance Data:");
  console.log(attendanceData);
  console.log("Profiles sample:", profiles?.slice(0,2));

  // Format and print the results
  console.table(attendanceData.map(log => {
    const prof = profiles?.find(p => p.id === log.employee_id);
    return {
      "Employee Name": prof ? `${prof.first_name} ${prof.last_name}` : 'Unknown',
      "Biometric ID": prof?.biometric_id || 'N/A',
      "Status": log.status,
      "Clock In (Local)": log.clock_in ? new Date(log.clock_in).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : '---',
      "Clock Out (Local)": log.clock_out ? new Date(log.clock_out).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : '---',
    };
  }));
}

checkAttendance();
