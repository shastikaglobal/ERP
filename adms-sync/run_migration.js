require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: parseInt(process.env.PG_PORT || '5432'),
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Connecting to database...');
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260707_farmers_extra_cols.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running migration script...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await pool.end();
  }
}

main();
