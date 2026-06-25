import { createClient } from '@supabase/supabase-js';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = dotenvConfig.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Checking Supabase payments table columns...");
  const { data, error } = await supabase.from('payments').select('*').limit(1);
  if (error) {
    console.error("Error fetching from payments:", error);
  } else {
    console.log("Success! First row or columns:", data.length > 0 ? Object.keys(data[0]) : "No rows found, trying to inspect schema info via query if possible.");
    
    // If no rows, let's try to query via a dynamic RPC if there's any, or list some columns.
    // Or we can just insert a temporary row and check, or we can check what fields we can select.
    if (data.length === 0) {
      console.log("Table is empty, let's try selecting specific columns to see which ones fail/succeed.");
      const columnsToTest = ['id', 'company_id', 'invoice_id', 'customer', 'amount', 'currency', 'method', 'status', 'received_at', 'created_at', 'updated_at', 'is_deleted', 'deleted_at', 'deleted_by', 'payment_number', 'payer_name', 'reference_number', 'created_by', 'notes'];
      for (const col of columnsToTest) {
        const { error: colError } = await supabase.from('payments').select(col).limit(1);
        if (colError) {
          console.log(`❌ Column ${col} fails:`, colError.message);
        } else {
          console.log(`✅ Column ${col} exists`);
        }
      }
    }
  }
}
run();
