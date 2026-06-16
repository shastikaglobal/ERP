const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/ERP/ERP/adms-sync/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testFetch() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@shastikaglobex.com', // or the correct admin email
    password: 'password123' // fallback, let's try the user's known token if possible?
  });
  
  // Wait, I can just use the service role key to generate a token, or simpler:
  // Let's just bypass auth for a moment in the local server? No, we are testing the VERCEL server.
}
testFetch();
