import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function main() {
  const { data, error } = await supabase.from('customers').select('*').limit(1);
  if (error) {
    console.error("Error fetching from customers:", error);
  } else {
    console.log("Customers table seems to exist. Sample data or columns structure:", data);
  }
}

main();
