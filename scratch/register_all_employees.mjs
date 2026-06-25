import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = dotenvConfig.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DB_CONFIG = {
  user:     env.PG_USER     || 'postgres',
  host:     env.PG_HOST     || '195.35.22.13',
  database: env.PG_DATABASE || 'shastika_erp',
  password: env.PG_PASSWORD || 'Shastika2026',
  port:     parseInt(env.PG_PORT || '5432', 10),
};

async function run() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  
  console.log("Fetching profiles from the database...");
  const { rows: profiles } = await client.query(`
    SELECT id, email, full_name, employee_id, biometric_id 
    FROM public.profiles 
    WHERE email IS NOT NULL AND is_deleted IS NOT TRUE
  `);
  console.log(`Found ${profiles.length} profiles to check/register.`);
  
  // Also get existing auth users to avoid redundant calls
  console.log("Listing existing Supabase Auth users...");
  let authUsers = [];
  try {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    authUsers = users || [];
    console.log(`Found ${authUsers.length} users in Supabase Auth.`);
  } catch (err) {
    console.warn("Could not list auth users directly, will rely on individual creation checks:", err.message);
  }
  
  for (const profile of profiles) {
    const email = profile.email.toLowerCase().trim();
    const existingUser = authUsers.find(u => u.email?.toLowerCase().trim() === email);
    
    if (existingUser) {
      console.log(`User ${email} already exists in Supabase Auth (Auth ID: ${existingUser.id}, Profile ID: ${profile.id}).`);
      // If IDs don't match, we might want to log it
      if (existingUser.id !== profile.id) {
        console.warn(`⚠️ ID Mismatch! Auth ID: ${existingUser.id} vs Profile ID: ${profile.id}`);
      }
      continue;
    }
    
    console.log(`Creating user: ${profile.full_name} (${email}) with ID ${profile.id}...`);
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        id: profile.id,
        email: email,
        password: 'Welcome@Shastika2026',
        email_confirm: true,
        user_metadata: {
          full_name: profile.full_name,
          employee_id: profile.employee_id,
          biometric_id: profile.biometric_id
        }
      });
      
      if (error) {
        console.error(`❌ Failed to create user ${email}:`, error.message);
      } else {
        console.log(`✅ Successfully created user ${email} (ID: ${data.user.id})`);
      }
    } catch (err) {
      console.error(`❌ Exception creating user ${email}:`, err.message);
    }
  }
  
  await client.end();
  console.log("All done!");
}

run().catch(console.error);
