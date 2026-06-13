const db = require('./db');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

(async () => {
  try {
    // Get a valid lead ID
    const leadRes = await db.query("SELECT id, stage FROM leads WHERE is_deleted IS FALSE LIMIT 1");
    if (!leadRes.rows.length) {
      console.log('No leads found');
      process.exit(0);
    }

    const leadId = leadRes.rows[0].id;
    const currentStage = leadRes.rows[0].stage;
    console.log(`Found lead: ${leadId}, current stage: ${currentStage}`);

    // Create service role Supabase client to get a valid token
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing Supabase config');
      process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Try to sign in with a test user or get public session
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@shastika.com',
      password: 'admin123'
    });

    if (error) {
      console.log('Cannot sign in test user (expected):', error.message);
      console.log('Testing with direct HTTP call instead...');

      // Make HTTP call to backend without auth (will fail but show error)
      const response = await fetch('http://localhost:8082/api/leads/' + leadId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage: 'Contacted' })
      });

      console.log('\nBackend Response Status:', response.status);
      const body = await response.json().catch(e => response.text());
      console.log('Response Body:', body);
      process.exit(0);
    }

    const token = data?.session?.access_token;
    if (!token) {
      console.log('Could not get access token');
      process.exit(1);
    }

    // Test the API
    const newStage = currentStage === 'New' ? 'Contacted' : 'New';
    console.log(`\nTesting stage update: ${currentStage} → ${newStage}`);

    const response = await fetch('http://localhost:8082/api/leads/' + leadId, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ stage: newStage })
    });

    console.log('Status:', response.status);
    const responseBody = await response.json();
    console.log('Response:', JSON.stringify(responseBody, null, 2));

    // Verify in database
    const verify = await db.query("SELECT id, stage FROM leads WHERE id = $1", [leadId]);
    console.log('\nDatabase verification:', verify.rows[0]);

  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
})();
