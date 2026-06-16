const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// We need an auth token since requireAuth is used
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = `temp-auth-${Math.floor(Math.random() * 1000000)}@example.com`;
  const password = 'Password123!';
  
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (createError) {
    console.error('Create error:', createError);
  }
  
  const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (signinError) {
    console.error('Sign in error:', signinError);
  }
  
  const token = signinData?.session?.access_token;
  if (!token) {
    console.error('No token obtained');
    return;
  }
  
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  try {
    const res = await fetch('http://195.35.22.13:8082/api/warehouse/packing_protocols', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

main();
