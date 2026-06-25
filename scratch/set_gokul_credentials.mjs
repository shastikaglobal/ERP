import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read environment variables
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      return [key, val];
    })
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const targetEmail = "lakshmanagokul97@gmail.com";
const newEmployeeId = "1001";
const newPassword = "Gokul2026";
const profileId = "00367dde-e414-41a1-bddc-e264c6c7aa57"; // Lakshmana Gokul's UUID

async function updateSupabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log(`[1] Updating Supabase profile for ${targetEmail} with Employee ID ${newEmployeeId}...`);
  
  // Update profiles table
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .update({ 
      employee_id: newEmployeeId,
      biometric_id: newEmployeeId
    })
    .eq('id', profileId)
    .select();

  if (profileErr) {
    console.error("Supabase profile update failed:", profileErr.message);
    return false;
  }
  console.log("Supabase profile updated:", profileData);

  // Update Auth user password
  console.log(`[2] Updating password for ${targetEmail} to "${newPassword}" in Supabase Auth...`);
  const { data: authData, error: authErr } = await supabase.auth.admin.updateUserById(
    profileId,
    { password: newPassword }
  );

  if (authErr) {
    console.error("Supabase Auth password update failed:", authErr.message);
    return false;
  }
  console.log("Supabase Auth password updated successfully!");
  return true;
}

async function updateVPS() {
  const pool = new Pool({
    user: env.PG_USER || 'postgres',
    host: env.PG_HOST || '195.35.22.13',
    database: env.PG_DATABASE || 'shastika_erp',
    password: env.PG_PASSWORD || 'Shastika2026',
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  console.log(`[3] Updating VPS PG database for profile ID ${profileId}...`);
  try {
    const res = await pool.query(
      `UPDATE profiles SET employee_id = $1, biometric_id = $2 WHERE id = $3 RETURNING *`,
      [newEmployeeId, newEmployeeId, profileId]
    );
    console.log("VPS DB update success:", res.rows);
  } catch (err) {
    console.error("VPS DB Error:", err.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  const sbOk = await updateSupabase();
  if (sbOk) {
    await updateVPS();
    console.log("\n🎉 ALL CREDENTIALS SET SUCCESSFULLY!");
  }
}

main().catch(console.error);
