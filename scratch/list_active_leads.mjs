import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
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
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('--- ACTIVE SUPABASE LEADS ---');
  const { data: sbLeads, error: sbErr } = await supabase
    .from('leads')
    .select('id, company_name, contact_name, email, created_at')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (sbErr) {
    console.error('Error:', sbErr.message);
  } else {
    sbLeads.forEach((l, index) => {
      console.log(`${index + 1}. ID: ${l.id}\n   Company: ${l.company_name}\n   Contact: ${l.contact_name}\n   Email: ${l.email}\n   Created: ${l.created_at}\n`);
    });
  }

  console.log('\n--- ACTIVE VPS LEADS ---');
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    const { rows: vpsLeads } = await pool.query(
      'SELECT id, company_name, contact_name, email, created_at FROM leads WHERE is_deleted = false OR is_deleted IS NULL ORDER BY created_at DESC'
    );
    vpsLeads.forEach((l, index) => {
      console.log(`${index + 1}. ID: ${l.id}\n   Company: ${l.company_name}\n   Contact: ${l.contact_name}\n   Email: ${l.email}\n   Created: ${l.created_at}\n`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
