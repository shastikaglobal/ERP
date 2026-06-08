import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Let's use the anon key first to check if RLS allows public writes
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
  const testUserId = '59df2897-02e4-4ab3-80ba-dc016642ba04'; // Karunya's ID
  const { data: existing, error: findError } = await sb.from('active_sessions').select('id').eq('user_id', testUserId).maybeSingle();
  if (findError) {
    console.error("Find error:", findError);
    return;
  }
  
  if (existing) {
    const { data, error } = await sb.from('active_sessions').update({
      profile_name: 'Karunya (Test-Update)',
      profile_role: 'ADMIN',
      last_active: new Date().toISOString(),
      device_info: 'Test Device Updated'
    }).eq('id', existing.id).select();
    console.log("Update response:", data, "Error:", error);
  } else {
    const { data, error } = await sb.from('active_sessions').insert({
      user_id: testUserId,
      profile_name: 'Karunya (Test-Insert)',
      profile_role: 'ADMIN',
      login_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      device_info: 'Test Device Insert'
    }).select();
    console.log("Insert response:", data, "Error:", error);
  }
}

testInsert();
