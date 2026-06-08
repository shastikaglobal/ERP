import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await sb.from('user_sessions').select('*').order('login_time', { ascending: false }).limit(5);
  console.log("User sessions:", data, "Error:", error);
}

run();
