const db = require('./adms-sync/db');

async function run() {
  try {
    console.log("Adding force_password_reset column...");
    await db.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT false;`);
    
    console.log("Setting force_password_reset = true for all active users...");
    await db.query(`UPDATE profiles SET force_password_reset = true WHERE is_deleted IS NOT TRUE AND status = 'active';`);
    
    console.log("Successfully updated profiles table.");
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    process.exit(0);
  }
}

run();
