require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: profs } = await supabase.from('profiles').select('id, full_name').ilike('full_name', '%karunya%');
  const karunyaId = profs && profs.length ? profs[0].id : null;
  if (!karunyaId) return console.log("Karunya not found");
  
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('employee_id', karunyaId)
    .eq('date', '2026-06-12');
  console.log("Data:", data, "Error:", error);
}
check();
