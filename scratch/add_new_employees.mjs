import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = 'd:/ERP1/ERP/.env';
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/"/g, '').replace(/\r/, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/"/g, '').replace(/\r/, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function addEmployee(fullName, salary, email) {
  console.log(`Adding ${fullName}...`);
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: 'Password123!',
    email_confirm: true
  });

  if (authError) {
    console.error(`Failed to create auth user for ${fullName}:`, authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`Auth user created with ID: ${userId}`);

  // 2. The trigger usually creates the profile automatically, let's wait a second
  await new Promise(r => setTimeout(r, 1000));

  // 3. Update the profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      monthly_salary: salary,
      status: 'approved',
      requested_role: 'employee',
      joining_date: '2026-06-01'
    })
    .eq('id', userId)
    .select();

  if (profileError) {
    console.error(`Failed to update profile for ${fullName}:`, profileError.message);
  } else {
    console.log(`Profile updated for ${fullName}:`, profileData);
  }
}

async function main() {
  await addEmployee('Vemula Navya Lahari', 32000, 'vemula.navya@shastikaglobalimpex.co.in');
  await addEmployee('Aditi', 20000, 'aditi@shastikaglobalimpex.co.in');
}

main();
