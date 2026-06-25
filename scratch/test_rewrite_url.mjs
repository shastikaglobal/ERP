import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log("Signing in as karunya...");
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'karunyaajothiprakash@gmail.com',
    password: 'Karunya@123'
  });
  
  const token = authData.session.access_token;
  
  // Call the endpoint on the domain used in vercel.json rewrite: shastikaglobalexport.co.in
  const rewriteUrl = 'https://shastikaglobalexport.co.in/api/employees/bio-data/all';
  console.log(`Fetching from rewrite URL: ${rewriteUrl}`);
  try {
    const res = await fetch(rewriteUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("Response status:", res.status);
    if (res.status !== 200) {
      const text = await res.text();
      console.log("Response text:", text);
    } else {
      const body = await res.json();
      console.log("Response body length:", body.length);
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

main();
