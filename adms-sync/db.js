const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'erp_admin',
  host: '127.0.0.1',
  database: 'shastika_erp',
  password: process.env.PG_PASSWORD,
  port: 5432,
});

// Helper for single queries
module.exports = {
  query: (text, params) => pool.query(text, params),
};
