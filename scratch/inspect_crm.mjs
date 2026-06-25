import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Read .env manually
const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const DUMMY_NAMES = [
  'kani',
  'SWATHI TEST',
  'kim.swathi',
  'pavish',
  'Exporters'
];

async function run() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('--- SUPABASE CUSTOMERS ---');
  const { data: sbCustomers, error: custErr } = await supabase
    .from('customers')
    .select('*');
  
  if (custErr) {
    console.error('Error fetching Supabase customers:', custErr.message);
  } else {
    console.log(`Total customers: ${sbCustomers.length}`);
    const dummyCusts = sbCustomers.filter(c => 
      DUMMY_NAMES.some(name => 
        (c.name && c.name.toLowerCase().includes(name.toLowerCase())) || 
        (c.email && c.email.toLowerCase().includes(name.toLowerCase()))
      )
    );
    console.log('Matching dummy customers:');
    dummyCusts.forEach(c => {
      console.log(`  - ID: ${c.id} | Name: ${c.name} | Email: ${c.email} | Farmer ID: ${c.farmer_id}`);
    });
  }

  console.log('\n--- SUPABASE LEADS ---');
  const { data: sbLeads, error: leadErr } = await supabase
    .from('leads')
    .select('*');
  
  if (leadErr) {
    console.error('Error fetching Supabase leads:', leadErr.message);
  } else {
    console.log(`Total leads: ${sbLeads.length}`);
    const dummyLeads = sbLeads.filter(l => 
      DUMMY_NAMES.some(name => 
        (l.company_name && l.company_name.toLowerCase().includes(name.toLowerCase())) ||
        (l.contact_name && l.contact_name.toLowerCase().includes(name.toLowerCase())) ||
        (l.email && l.email.toLowerCase().includes(name.toLowerCase()))
      )
    );
    console.log('Matching dummy leads:');
    dummyLeads.forEach(l => {
      console.log(`  - ID: ${l.id} | Company: ${l.company_name} | Contact: ${l.contact_name} | Email: ${l.email}`);
    });
  }

  console.log('\n--- VPS DATABASE ---');
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    const { rows: vpsCustomers } = await pool.query('SELECT * FROM customers');
    const dummyVpsCusts = vpsCustomers.filter(c => 
      DUMMY_NAMES.some(name => 
        (c.name && c.name.toLowerCase().includes(name.toLowerCase())) || 
        (c.email && c.email.toLowerCase().includes(name.toLowerCase()))
      )
    );
    console.log(`Total VPS customers: ${vpsCustomers.length}`);
    console.log('Matching dummy VPS customers:');
    dummyVpsCusts.forEach(c => {
      console.log(`  - ID: ${c.id} | Name: ${c.name} | Email: ${c.email} | Farmer ID: ${c.farmer_id}`);
    });

    const { rows: vpsLeads } = await pool.query('SELECT * FROM leads');
    const dummyVpsLeads = vpsLeads.filter(l => 
      DUMMY_NAMES.some(name => 
        (l.company_name && l.company_name.toLowerCase().includes(name.toLowerCase())) ||
        (l.contact_name && l.contact_name.toLowerCase().includes(name.toLowerCase())) ||
        (l.email && l.email.toLowerCase().includes(name.toLowerCase()))
      )
    );
    console.log(`Total VPS leads: ${vpsLeads.length}`);
    console.log('Matching dummy VPS leads:');
    dummyVpsLeads.forEach(l => {
      console.log(`  - ID: ${l.id} | Company: ${l.company_name} | Contact: ${l.contact_name} | Email: ${l.email}`);
    });

  } catch (err) {
    console.error('VPS Database error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
