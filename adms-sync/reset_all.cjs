require('dotenv').config({path: '../.env'});
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});

async function resetAll() {
  const newPassword = 'Shastika123!';
  
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update all users
    await pool.query('UPDATE profiles SET password_hash = $1, force_password_reset = true', [passwordHash]);
    
    // Fetch them all to display
    const { rows } = await pool.query('SELECT employee_id, full_name, email FROM profiles ORDER BY employee_id ASC NULLS LAST');
    
    let output = "| Employee ID | Full Name | Email Address | Password (Temporary) |\n";
    output += "| :--- | :--- | :--- | :--- |\n";
    
    rows.forEach(r => {
      output += `| **${r.employee_id || 'N/A'}** | ${r.full_name || 'N/A'} | \`${r.email}\` | \`${newPassword}\` |\n`;
    });
    
    console.log(output);
    fs.writeFileSync('../all_passwords.md', output);
    console.log('\nSaved to all_passwords.md');
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

resetAll();
