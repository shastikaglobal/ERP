const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE || 'shastika_erp',
});

async function createAdmin() {
  try {
    const password = 'Admin@Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const result = await pool.query(
      `INSERT INTO profiles (id, email, password_hash, full_name, employee_id, role, status, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, email, full_name, role, status`,
      [userId, 'swathitae35@gmail.com', hashedPassword, 'Swathi', '2001', 'admin', 'approved', true]
    );

    console.log('User created successfully:');
    console.log(result.rows[0]);
    console.log('Password set to: Admin@Password123!');
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  } finally {
    pool.end();
  }
}

createAdmin();
