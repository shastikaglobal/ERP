const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || '195.35.22.13',
  user: 'erp_admin',
  password: process.env.PG_PASSWORD || 'Shastika2026',
  database: 'shastika_erp',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔄 Altering user_roles table constraints...');

    // 1. Drop existing composite primary key
    await client.query('ALTER TABLE user_roles DROP CONSTRAINT user_roles_pkey');
    console.log('✅ Dropped composite primary key constraint user_roles_pkey');

    // 2. Add new primary key on user_id only
    await client.query('ALTER TABLE user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id)');
    console.log('✅ Added new primary key constraint on user_id');

    await client.query('COMMIT');
    console.log('\n🎉 Successfully updated database constraints! One person can now only have one role.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Failed to update constraint, transaction rolled back:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
