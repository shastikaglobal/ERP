const db = require('./db.js');
const bcrypt = require('bcryptjs');

async function setPassword() {
  try {
    const email = 'shastikaglobal11@gmail.com';
    const password = 'Password123!';
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update user profile or insert if it doesn't exist
    const { rowCount } = await db.query(
      'UPDATE profiles SET password_hash = $1 WHERE email = $2', 
      [passwordHash, email]
    );
    
    if (rowCount > 0) {
      console.log(`Successfully updated password for ${email}. Password: ${password}`);
    } else {
      console.log(`Email ${email} not found. Attempting to insert a test profile...`);
      const { rows } = await db.query(
        'INSERT INTO profiles (email, full_name, password_hash, is_active, is_deleted) VALUES ($1, $2, $3, true, false) RETURNING email',
        [email, 'Admin User', passwordHash]
      );
      console.log(`Created test profile for ${email}. Password: ${password}`);
    }
  } catch (err) {
    console.error('Update password error:', err);
  } finally {
    process.exit(0);
  }
}

setPassword();
