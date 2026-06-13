const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, biometric_id, role, requested_role')
    .ilike('full_name', '%shastika%');

  if (error) {
    console.error("Error fetching shastika:", error);
  } else {
    console.log("Found:", data);
  }
}

main();
