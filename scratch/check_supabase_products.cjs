const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/ERP/ERP/adms-sync/.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase query error:', error);
    } else {
      console.log('Supabase products first row:', JSON.stringify(products, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
