import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ override: true });

const env = dotenv.parse(readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function syncNarmathaManual() {
  console.log("Manually adding punch for Narmatha (1015)...");
  
  // 1. Get Narmatha's profile ID
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, company_id')
    .eq('biometric_id', '1015');

  if (profErr || !profiles || profiles.length === 0) {
    console.error("❌ Could not find Narmatha with bio ID 1015");
    return;
  }

  const narmatha = profiles[0];
  console.log("Found Narmatha:", narmatha.id);

  const todayStr = new Date().toISOString().substring(0, 10);
  const clockIn = new Date();
  clockIn.setHours(9, 10, 0, 0); // 9:10 AM today
  
  // Upsert attendance for today
  const { data: existing, error: existErr } = await supabase
    .from('attendance_logs')
    .select('id')
    .eq('employee_id', narmatha.id)
    .eq('date', todayStr)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('attendance_logs')
      .update({
        clock_in: clockIn.toISOString(),
        status: 'present'
      })
      .eq('id', existing.id);
    if (error) console.error("Update error:", error.message);
    else console.log("✅ Updated today's attendance log.");
  } else {
    const { error } = await supabase
      .from('attendance_logs')
      .insert({
        employee_id: narmatha.id,
        company_id: narmatha.company_id,
        date: todayStr,
        status: 'present',
        clock_in: clockIn.toISOString()
      });
    if (error) console.error("Insert error:", error.message);
    else console.log("✅ Inserted today's attendance log.");
  }
}

syncNarmathaManual();
