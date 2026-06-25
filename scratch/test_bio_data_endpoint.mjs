import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log("Signing in as karunya...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'karunyaajothiprakash@gmail.com',
    password: 'Karunya@123'
  });
  
  if (authErr) {
    console.error("Login failed:", authErr.message);
    return;
  }
  
  const token = authData.session.access_token;
  console.log("Logged in successfully. Token length:", token.length);
  
  // Call the endpoint on the production VPS
  const productionUrl = 'https://erp.shastikaglobalexport.co.in/api/employees/bio-data/all';
  console.log(`Fetching from production VPS: ${productionUrl}`);
  try {
    const res = await fetch(productionUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("Production response status:", res.status);
    const body = await res.json();
    console.log("Production response body type:", Array.isArray(body) ? `Array (length ${body.length})` : typeof body);
    if (Array.isArray(body)) {
      console.log("Sample of first few items:");
      body.slice(0, 3).forEach(item => {
        console.log(`- id=${item.id}, employee_id=${item.employee_id}, has_employees_prop=${!!item.employees}`);
        if (item.employees) {
          console.log(`  employees prop:`, item.employees);
        }
      });
      
      const karunyaItems = body.filter(item => item.employee_id === '59df2897-02e4-4ab3-80ba-dc016642ba04');
      console.log(`Karunya's items count:`, karunyaItems.length);
    } else {
      console.log("Response body:", body);
    }
  } catch (err) {
    console.error("Failed to fetch from production:", err.message);
  }
}

main();
