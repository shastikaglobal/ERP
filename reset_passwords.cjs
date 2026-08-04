const db = require('./adms-sync/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');

async function run() {
  try {
    const { rows: profiles } = await db.query('SELECT id, full_name, email FROM profiles WHERE is_deleted IS NOT TRUE');
    
    // We will check if a column like 'force_password_reset' exists.
    const { rows: columns } = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'");
    const hasForceReset = columns.some(c => c.column_name === 'force_password_reset');
    
    let mdTable = "| Employee ID | Name | Email | New Temporary Password |\n|---|---|---|---|\n";
    let count = 0;
    
    for (const p of profiles) {
      if (!p.email) continue;
      
      // Generate 10 char random password
      const tempPass = crypto.randomBytes(5).toString('hex'); // 10 chars, letters and numbers
      
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(tempPass, salt);
      
      if (hasForceReset) {
        await db.query('UPDATE profiles SET password_hash = $1, force_password_reset = true WHERE id = $2', [hash, p.id]);
      } else {
        await db.query('UPDATE profiles SET password_hash = $1 WHERE id = $2', [hash, p.id]);
      }
      
      mdTable += `| ${p.id} | ${p.full_name || 'N/A'} | ${p.email} | \`${tempPass}\` |\n`;
      count++;
    }
    
    mdTable += `\n**Total accounts reset: ${count}**\n`;
    if (!hasForceReset) {
      mdTable += `\n*Note: The 'force_password_reset' column does not exist in the profiles table, so the forced change flag could not be set.*`;
    }
    
    fs.writeFileSync('passwords_output.md', mdTable);
    console.log("Passwords generated and saved to passwords_output.md");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
