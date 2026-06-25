import { createClient } from '@supabase/supabase-js';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = dotenvConfig.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log("Testing sign in for shastikaglobal11@gmail.com...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'shastikaglobal11@gmail.com',
    password: 'Welcome@Shastika2026'
  });
  if (error) {
    console.error("❌ Sign in failed:", error.message);
  } else {
    console.log("✅ Sign in successful! Session user:", data.user.email);
  }
}
run();
