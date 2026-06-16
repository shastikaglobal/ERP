const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .limit(10);
    
  if (error) {
    console.error('Error fetching from Supabase:', error);
  } else {
    console.log('Supabase farmers count:', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

main();
