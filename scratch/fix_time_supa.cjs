require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  console.log("Fixing attendance_logs...");
  const { data: logs, error: err1 } = await supabase.from('attendance_logs').select('id, clock_in, clock_out').eq('date', '2026-06-12').eq('is_manual', false);
  if (err1) return console.error(err1);
  for (let log of logs) {
    const newIn = new Date(new Date(log.clock_in).getTime() + 5.5 * 3600000).toISOString();
    const newOut = log.clock_out ? new Date(new Date(log.clock_out).getTime() + 5.5 * 3600000).toISOString() : null;
    await supabase.from('attendance_logs').update({ clock_in: newIn, clock_out: newOut }).eq('id', log.id);
  }
  console.log(`Updated ${logs.length} rows in attendance_logs.`);

  console.log("Fixing AttLogs...");
  const { data: rawLogs, error: err2 } = await supabase.from('AttLogs').select('id, LogDateTime').gte('LogDateTime', '2026-06-11').eq('DeviceId', 'NFZ8250603096');
  if (err2) return console.error(err2);
  for (let r of rawLogs) {
    const newTime = new Date(new Date(r.LogDateTime).getTime() + 5.5 * 3600000).toISOString();
    await supabase.from('AttLogs').update({ LogDateTime: newTime }).eq('id', r.id);
  }
  console.log(`Updated ${rawLogs.length} rows in AttLogs.`);
}
fix();
