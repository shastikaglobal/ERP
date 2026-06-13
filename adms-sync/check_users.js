const db = require('./db');

(async () => {
  try {
    // Check for existing profiles
    const profiles = await db.query("SELECT id, email, full_name FROM profiles LIMIT 5");
    console.log('Sample profiles:', JSON.stringify(profiles.rows, null, 2));

    // Check if there are any users in Supabase auth
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config({ path: '../.env' });

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all users
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.log('Auth error:', error);
      process.exit(0);
    }

    console.log(`\nFound ${users.users.length} users in Supabase:`);
    users.users.slice(0, 5).forEach(u => {
      console.log(`- ${u.email} (${u.id})`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
})();
