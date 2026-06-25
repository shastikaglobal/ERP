import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
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

async function checkVPSDb() {
  console.log("=== VPS Postgres Database Audit ===");
  const client = new Client({
    user: env.PG_USER || 'postgres',
    host: env.PG_HOST || '195.35.22.13',
    database: env.PG_DATABASE || 'shastika_erp',
    password: env.PG_PASSWORD || 'Shastika2026',
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    await client.connect();
    
    // 1. Get Tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tablesRes = await client.query(tablesQuery);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables in VPS database:`, tables);

    // 2. Get Columns per table
    const columnsMap = {};
    for (const table of tables) {
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1 
        ORDER BY ordinal_position;
      `;
      const colsRes = await client.query(columnsQuery, [table]);
      columnsMap[table] = colsRes.rows.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable
      }));
    }

    return { tables, columnsMap };
  } catch (err) {
    console.error("VPS DB Audit Error:", err.message);
    return null;
  } finally {
    await client.end();
  }
}

async function checkSupabase() {
  console.log("\n=== Supabase Database Audit ===");
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env");
    return null;
  }

  // To check actual tables, columns and RLS, we can execute raw SQL in Supabase via an RPC, or if there's no RPC we can check what's available.
  // Wait, does Supabase have a way to list tables and RLS?
  // Yes! If there is a schema cache or if we can run an RPC like 'exec_sql' (sometimes developers create one), let's check.
  // If not, we can check by querying the supabase client and seeing what tables exist by trying to select from them, OR we can execute a PG query if the Supabase Postgres port is open!
  // Wait, is the Supabase Postgres database accessible directly?
  // Let's check if the connection string for Supabase Postgres is in the .env file!
  // Typically, Supabase connection string is not in .env, but let's check what variables are in `.env`.
  console.log("Keys in .env:", Object.keys(env));
  
  // Wait, let's look at check_supabase_tables.mjs or execute_pg_sql.mjs in the scratch folder to see how they queried Supabase tables.
}

async function main() {
  const vpsData = await checkVPSDb();
  await checkSupabase();
}

main().catch(console.error);
