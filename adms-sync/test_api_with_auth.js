// Test with actual authentication
const http = require('http');
const path = require('path');
const fs = require('fs');

// Load env vars
const dotenvPath = fs.existsSync(path.join(__dirname, '.env'))
  ? path.join(__dirname, '.env')
  : path.join(__dirname, '..', '.env');

require('dotenv').config({ path: dotenvPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BASE_URL = 'http://127.0.0.1:8082';
const COMPANY_ID = '00000000-0000-0000-0000-00000000ae01';

async function makeRequest(method, path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    console.log(`  Making request: ${method} ${url.pathname}${url.search}`);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    console.log('🧪 TESTING WITH AUTHENTICATION\n');

    // Create a test user session (service role can create users)
    console.log('📧 Creating test user...');
    const testEmail = `test-workflow-${Date.now()}@test.com`;
    const testPassword = 'Test@1234567890';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Failed to create test user:', authError.message);
      process.exit(1);
    }

    console.log(`✅ Test user created: ${testEmail}\n`);

    // Get a session token using a regular client
    console.log('🔑 Getting session token...');
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (sessionError) {
      console.error('❌ Failed to sign in:', sessionError.message);
      process.exit(1);
    }

    const token = sessionData.session.access_token;
    console.log('✅ Got session token\n');

    // Now test the endpoints with the valid token
    console.log('Testing workflow endpoints with valid authentication:\n');

    console.log('1️⃣  GET /api/leads/workflow/successful-conversations');
    const succRes = await makeRequest('GET', `/api/leads/workflow/successful-conversations?company_id=${COMPANY_ID}`, token);
    console.log(`  Status: ${succRes.status}`);
    if (succRes.status === 200) {
      console.log(`  ✅ Success! Records: ${succRes.data.length || 0}`);
      if (succRes.data.length > 0) {
        console.log(`  Sample: ${succRes.data[0].company_name} (stage: ${succRes.data[0].stage})`);
      }
    } else {
      console.log(`  ❌ Error: ${succRes.status} - ${succRes.data?.error || succRes.data?.toString().substring(0, 100)}`);
    }
    console.log('');

    console.log('2️⃣  GET /api/leads/workflow/client-acquisition');
    const acqRes = await makeRequest('GET', `/api/leads/workflow/client-acquisition?company_id=${COMPANY_ID}`, token);
    console.log(`  Status: ${acqRes.status}`);
    if (acqRes.status === 200) {
      console.log(`  ✅ Success! Records: ${acqRes.data.length || 0}`);
      if (acqRes.data.length > 0) {
        console.log(`  Sample: ${acqRes.data[0].company_name} (stage: ${acqRes.data[0].stage})`);
      }
    } else {
      console.log(`  ❌ Error: ${acqRes.status} - ${acqRes.data?.error || acqRes.data?.toString().substring(0, 100)}`);
    }
    console.log('');

    console.log('✨ TESTS COMPLETE');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
  }
})();
