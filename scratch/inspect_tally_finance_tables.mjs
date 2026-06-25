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

const tables = [
  'chart_of_accounts',
  'parties',
  'journal_entries',
  'journal_entry_rows',
  'invoices',
  'payments'
];

async function run() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('--- SUPABASE DETAILED ROWS ---');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(20);
    if (error) {
      console.error(`Error querying Supabase table ${table}:`, error.message);
    } else {
      console.log(`\nTable: ${table} (${data.length} rows found)`);
      data.forEach(row => {
        if (table === 'chart_of_accounts') {
          console.log(`  - ID: ${row.id}, Code: ${row.code}, Name: ${row.name}, Balance: ${row.balance}`);
        } else if (table === 'parties') {
          console.log(`  - ID: ${row.id}, Name: ${row.name}, GSTIN: ${row.gstin}, Type: ${row.type}`);
        } else if (table === 'journal_entries') {
          console.log(`  - ID: ${row.id}, Voucher: ${row.voucher_no}, Total Debit: ${row.total_debit}, Narration: ${row.narration}`);
        } else if (table === 'invoices') {
          console.log(`  - ID: ${row.id}, Number: ${row.invoice_number}, Amount: ${row.amount}, Status: ${row.status}`);
        } else if (table === 'payments') {
          console.log(`  - ID: ${row.id}, Number: ${row.payment_number}, Amount: ${row.amount}, Status: ${row.status}`);
        } else {
          console.log(`  - Row:`, JSON.stringify(row).slice(0, 150));
        }
      });
    }
  }

  console.log('\n--- VPS PG DETAILED ROWS ---');
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    for (const table of tables) {
      try {
        const { rows } = await pool.query(`SELECT * FROM ${table} LIMIT 20`);
        console.log(`\nTable: ${table} (${rows.length} rows found)`);
        rows.forEach(row => {
          if (table === 'chart_of_accounts') {
            console.log(`  - ID: ${row.id}, Code: ${row.code}, Name: ${row.name}, Balance: ${row.balance}`);
          } else if (table === 'parties') {
            console.log(`  - ID: ${row.id}, Name: ${row.name}, GSTIN: ${row.gstin}, Type: ${row.type}`);
          } else if (table === 'journal_entries') {
            console.log(`  - ID: ${row.id}, Voucher: ${row.voucher_no}, Total Debit: ${row.total_debit}, Narration: ${row.narration}`);
          } else if (table === 'invoices') {
            console.log(`  - ID: ${row.id}, Number: ${row.invoice_number}, Amount: ${row.amount}, Status: ${row.status}`);
          } else if (table === 'payments') {
            console.log(`  - ID: ${row.id}, Number: ${row.payment_number}, Amount: ${row.amount}, Status: ${row.status}`);
          } else {
            console.log(`  - Row:`, JSON.stringify(row).slice(0, 150));
          }
        });
      } catch (err) {
        console.log(`Error querying VPS PG table ${table}:`, err.message);
      }
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

run();
