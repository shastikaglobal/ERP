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
  
  console.log("Signing in...");
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'karunyaajothiprakash@gmail.com',
    password: 'Karunya@123'
  });
  
  const token = authData.session.access_token;
  
  // 1. Fetch embeddings
  const resEmbeddings = await fetch('https://erp.shastikaglobalexport.co.in/api/employees/bio-data/all', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const embeddings = await resEmbeddings.json();
  
  // 2. Fetch employees
  const { data: employeesList } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'approved')
    .eq('is_deleted', false)
    .order('full_name');
    
  console.log("--- DEBUG ---");
  console.log("Embeddings count:", embeddings.length);
  console.log("EmployeesList count:", employeesList.length);
  
  const wfhEmployees = employeesList ? employeesList.filter(e => e.system_mode === 'wfh') : [];
  const wfhEmpIds = new Set(wfhEmployees.map(e => e.id));
  
  console.log("WFH Employees:", wfhEmployees.map(e => `${e.full_name} (${e.id})`));
  console.log("WFH Emp IDs Set:", Array.from(wfhEmpIds));
  
  console.log("First embedding sample employee_id type:", typeof embeddings[0]?.employee_id, "value:", embeddings[0]?.employee_id);
  
  const filtered = embeddings.filter(emb => wfhEmpIds.has(emb.employee_id));
  console.log("Filtered embeddings count:", filtered.length);
  
  if (filtered.length > 0) {
    console.log("Sample filtered:", filtered.map(f => f.employee_id));
  } else {
    console.log("Warning: filter resulted in 0 rows!");
    // Check if any employee_id in embeddings matches a WFH employee ID
    embeddings.forEach((emb, i) => {
      const match = wfhEmpIds.has(emb.employee_id);
      console.log(`[${i}] emb.employee_id: "${emb.employee_id}" (len ${emb.employee_id?.length}) in Set? ${match}`);
    });
  }
}

main();
