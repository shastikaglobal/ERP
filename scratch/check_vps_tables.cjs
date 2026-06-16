require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE || 'postgres',
  port: process.env.PG_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // List tables
    const { rows: tables } = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    console.log('=== VPS DB Tables ===');
    tables.forEach(t => console.log(' -', t.table_name));

    // Check profiles table columns if exists
    const profilesTable = tables.find(t => t.table_name === 'profiles');
    if (profilesTable) {
      const { rows: cols } = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='profiles' ORDER BY ordinal_position"
      );
      console.log('\n=== profiles columns ===');
      cols.forEach(c => console.log(' -', c.column_name, ':', c.data_type));

      const { rows: sample } = await pool.query('SELECT * FROM profiles LIMIT 3');
      console.log('\n=== profiles sample ===', JSON.stringify(sample, null, 2));
    }

    // Check employees table if exists
    const empTable = tables.find(t => t.table_name === 'employees');
    if (empTable) {
      const { rows: cols } = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='employees' ORDER BY ordinal_position"
      );
      console.log('\n=== employees columns ===');
      cols.forEach(c => console.log(' -', c.column_name, ':', c.data_type));
      const { rows: sample } = await pool.query('SELECT * FROM employees LIMIT 3');
      console.log('\n=== employees sample ===', JSON.stringify(sample, null, 2));
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
