const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE || 'shastika_erp',
});

async function updatePassword() {
  try {
    const password = 'swathi@2026';
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `UPDATE profiles SET password_hash = $1 WHERE employee_id = $2 RETURNING id, email, full_name, role`,
      [hashedPassword, '2001']
    );

    console.log('Password updated successfully for user:');
    console.log(result.rows[0]);
  } catch (err) {
    console.error('Error updating password:', err.message);
  } finally {
    pool.end();
  }
}

updatePassword();
