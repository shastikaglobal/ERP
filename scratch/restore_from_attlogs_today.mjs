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

async function restoreFromAttLogs() {
  console.log("Fetching profiles to map Biometric ID to Employee ID...");
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, company_id, biometric_id');
  if (profErr) throw new Error(profErr.message);

  console.log("Fetching logs from AttLogs for today...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Optional: if they want from the start of the month for 'daily' attendance, uncomment below:
  // today.setDate(1); 
  const dynamicDateStr = today.toISOString().split('T')[0];
  
  const { data: attLogs, error: attErr } = await supabase
    .from('AttLogs')
    .select('*')
    .gte('LogDateTime', dynamicDateStr)
    .order('LogDateTime', { ascending: true });

  if (attErr) throw new Error(attErr.message);
  console.log(`Found ${attLogs.length} raw punch records.`);

  // Group by Employee and Date
  const grouped = {};
  
  for (const log of attLogs) {
    const bioId = log.EmployeeCode.toString().trim();
    const dt = new Date(log.LogDateTime);
    const dateStr = dt.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const emp = profiles.find(p => p.biometric_id === bioId || (p.biometric_id && Number(p.biometric_id) === Number(bioId)));
    if (!emp) continue; // Unknown employee

    const key = `${emp.id}_${dateStr}`;
    if (!grouped[key]) {
      grouped[key] = {
        employee_id: emp.id,
        company_id: emp.company_id,
        date: dateStr,
        status: 'present',
        punches: []
      };
    }
    grouped[key].punches.push(dt);
  }

  // Insert into attendance_logs
  const insertPayloads = [];
  for (const key in grouped) {
    const record = grouped[key];
    record.punches.sort((a, b) => a - b);
    
    // First punch is clock_in, last punch is clock_out
    const clock_in = record.punches[0].toISOString();
    const clock_out = record.punches.length > 1 ? record.punches[record.punches.length - 1].toISOString() : null;

    insertPayloads.push({
      employee_id: record.employee_id,
      date: record.date,
      status: record.status,
      clock_in: clock_in,
      clock_out: clock_out,
      is_manual: false
    });
  }

  console.log(`Prepared ${insertPayloads.length} combined daily attendance records.`);

  let successCount = 0;
  for (const payload of insertPayloads) {
    const { data: existing } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('employee_id', payload.employee_id)
      .eq('date', payload.date)
      .maybeSingle();

    if (existing) {
      const { error: updErr } = await supabase.from('attendance_logs').update({
        clock_in: payload.clock_in,
        clock_out: payload.clock_out,
        status: payload.status
      }).eq('id', existing.id);
      if (updErr) console.error("Update error:", updErr);
    } else {
      const { error: insErr } = await supabase.from('attendance_logs').insert(payload);
      if (insErr) console.error("Insert error:", insErr);
    }
    successCount++;
  }

  console.log(`✅ Successfully restored ${successCount} daily records from raw AttLogs!`);
}

restoreFromAttLogs().catch(console.error);
