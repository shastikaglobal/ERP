const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Find .env file - try multiple locations
const dotenvPath = fs.existsSync(path.join(__dirname, '.env'))
  ? path.join(__dirname, '.env')
  : fs.existsSync(path.join(__dirname, '..', '.env'))
    ? path.join(__dirname, '..', '.env')
    : path.join(process.cwd(), '.env');

require('dotenv').config({ path: dotenvPath });

console.log(`[DB] Using .env from: ${dotenvPath}`);

const pgHost = process.env.PG_HOST || '127.0.0.1';
const pgPort = parseInt(process.env.PG_PORT || '5432', 10);
const pgUser = process.env.PG_USER || 'erp_admin';
const pgDatabase = process.env.PG_DATABASE || 'shastika_erp';
const pgPassword = process.env.PG_PASSWORD;

if (!pgPassword) {
  console.error('❌ CRITICAL ERROR: PG_PASSWORD is not set in .env');
  process.exit(1);
}

const pool = new Pool({
  user: pgUser,
  host: pgHost,
  database: pgDatabase,
  password: pgPassword,
  port: pgPort,
});

console.log('🔗 PostgreSQL DB config:', {
  host: pgHost,
  port: pgPort,
  user: pgUser,
  database: pgDatabase,
});

// Helper for queries with RLS context
const queryWithRLS = async (text, params, userId) => {
  const client = await pool.connect();
  try {
    if (userId) {
      // Set auth context for RLS policies
      // This allows functions like current_company_id() to work with auth.uid()
      await client.query('SELECT set_config($1, $2, false)', ['request.jwt.claims', JSON.stringify({ sub: userId, user_id: userId })])
      console.log(`[DB] Set auth context for user ${userId}`);
    }
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Helper for single queries (pool.query)
const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
  queryWithRLS,
  pool
};
