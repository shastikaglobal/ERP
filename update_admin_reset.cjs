require('dotenv').config({ path: './.env' });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT || 5432
});

async function resetAdminPassword() {
  const adminEmail = 'shastikaglobal11@gmail.com';
  const newPassword = 'admin'; // You can change this to whatever you want the temporary password to be

  try {
    console.log(`Hashing new password for ${adminEmail}...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    console.log('Updating database...');
    const result = await pool.query(
      "UPDATE profiles SET password_hash = $1, force_password_reset = true, updated_at = NOW() WHERE email = $2 RETURNING id",
      [passwordHash, adminEmail]
    );

    if (result.rowCount > 0) {
      console.log(`\nâœ… SUCCESS: Password for ${adminEmail} has been reset!`);
      console.log(`\nYou can now log in using:`);
      console.log(`User ID / Email: ${adminEmail}`);
      console.log(`Password: ${newPassword}\n`);
    } else {
      console.log(`\nâŒ ERROR: Could not find user with email ${adminEmail} in the database.`);
    }
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
