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

// 1. Update in Supabase
async function updateSupabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log("Updating Supabase system_mode to 'wfo' (or null) for karunya...");
  const { data, error } = await supabase
    .from('profiles')
    .update({ system_mode: null }) // Set to null/default (which is WFO)
    .eq('id', '59df2897-02e4-4ab3-80ba-dc016642ba04')
    .select();

  if (error) {
    console.error("Supabase update error:", error.message);
  } else {
    console.log("Supabase update success:", data);
  }
}

// 2. Update in VPS DB
async function updateVPS() {
  const pool = new Pool({
    user: env.PG_USER || 'postgres',
    host: env.PG_HOST || '195.35.22.13',
    database: env.PG_DATABASE || 'shastika_erp',
    password: env.PG_PASSWORD || 'Shastika2026',
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  console.log("Updating VPS PG database system_mode to NULL for karunya...");
  try {
    const res = await pool.query(
      `UPDATE profiles SET system_mode = NULL WHERE id = $1 RETURNING *`,
      ['59df2897-02e4-4ab3-80ba-dc016642ba04']
    );
    console.log("VPS DB update success:", res.rows);
  } catch (err) {
    console.error("VPS DB Error:", err.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  await updateSupabase();
  await updateVPS();
}

main().catch(console.error);
