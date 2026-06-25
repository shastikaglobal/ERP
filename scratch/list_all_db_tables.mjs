import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

async function run() {
  console.log('--- VPS PG SCHEMA ---');
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`Found ${rows.length} tables in VPS:`);
    for (const r of rows) {
      const tableName = r.table_name;
      try {
        const countRes = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`  - ${tableName.padEnd(30)}: ${countRes.rows[0].count} rows`);
      } catch (err) {
        console.log(`  - ${tableName.padEnd(30)}: Error reading count (${err.message})`);
      }
    }
  } catch (err) {
    console.error('VPS PG Error:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n--- SUPABASE SCHEMA ---');
  // We can query Supabase database list via PostgREST OpenAPI
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        }
      });
      if (res.ok) {
        const openapi = await res.json();
        const tables = Object.keys(openapi.definitions || {}).sort();
        console.log(`Found ${tables.length} objects/tables in Supabase PostgREST:`);
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        for (const table of tables) {
          try {
            const { count, error } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true });
            console.log(`  - ${table.padEnd(30)}: ${count ?? 0} rows ${error ? `(Error: ${error.message})` : ''}`);
          } catch (err) {
            console.log(`  - ${table.padEnd(30)}: Exception reading count (${err.message})`);
          }
        }
      } else {
        console.error('PostgREST response not OK:', await res.text());
      }
    } catch (err) {
      console.error('Supabase fetch error:', err.message);
    }
  } else {
    console.log('Supabase config not found.');
  }
}

run();
