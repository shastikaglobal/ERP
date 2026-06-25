import pg from 'pg';
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
  console.log("\n=== AUDITING VPS POSTGRES DATABASE ===");
  const host = env.PG_HOST;
  if (!host) {
    console.error("No PG_HOST in .env");
    return null;
  }

  const client = new Client({
    user: env.PG_USER || 'postgres',
    host: host,
    database: env.PG_DATABASE || 'shastika_erp',
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    await client.connect();
    
    // 1. Get Tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Tables in VPS public schema (${tables.length}):`, tables.join(', '));

    // 2. Get Columns per table
    const columnsMap = {};
    for (const table of tables) {
      const colsRes = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1 
        ORDER BY ordinal_position;
      `, [table]);
      columnsMap[table] = colsRes.rows.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable
      }));
    }

    return { tables, columnsMap };
  } catch (err) {
    console.error("VPS DB Connection / Query failed:", err.message);
    return null;
  } finally {
    await client.end();
  }
}

async function checkSupabaseDb() {
  console.log("\n=== AUDITING SUPABASE POSTGRES DATABASE ===");
  const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL;
  if (!dbUrl) {
    console.error("No SUPABASE_DB_URL or DATABASE_URL in .env");
    return null;
  }

  console.log("Connecting using connection URL...");
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Get Tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Tables in Supabase public schema (${tables.length}):`, tables.join(', '));

    // 2. Get Columns per table
    const columnsMap = {};
    for (const table of tables) {
      const colsRes = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1 
        ORDER BY ordinal_position;
      `, [table]);
      columnsMap[table] = colsRes.rows.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable
      }));
    }

    // 3. Get RLS Policy Status (Row Level Security enabled? policies count?)
    // In PostgreSQL, pg_class.relrowsecurity is true if RLS is enabled on the table
    const rlsRes = await client.query(`
      SELECT 
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled,
        COUNT(p.polname) AS policies_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_policy p ON p.polrelid = c.oid
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      GROUP BY c.relname, c.relrowsecurity
      ORDER BY c.relname;
    `);
    
    const rlsMap = {};
    rlsRes.rows.forEach(r => {
      rlsMap[r.table_name] = {
        enabled: r.rls_enabled,
        policiesCount: parseInt(r.policies_count, 10)
      };
    });

    return { tables, columnsMap, rlsMap };
  } catch (err) {
    console.error("Supabase DB Connection / Query failed:", err.message);
    return null;
  } finally {
    await client.end();
  }
}

async function main() {
  const vpsInfo = await checkVPSDb();
  const sbInfo = await checkSupabaseDb();

  // Save the database structures to a JSON file for analysis
  const output = {
    vps: vpsInfo,
    supabase: sbInfo
  };
  fs.writeFileSync(path.join(__dirname, 'db_audit_metadata.json'), JSON.stringify(output, null, 2));
  console.log("\nDatabase schema audit metadata written to db_audit_metadata.json");
}

main().catch(console.error);
