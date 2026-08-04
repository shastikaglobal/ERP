const db = require('./adms-sync/db');

async function run() {
  try {
    console.log("Setting force_password_reset = true for all non-deleted users...");
    await db.query(`UPDATE profiles SET force_password_reset = true WHERE is_deleted IS NOT TRUE;`);
    
    console.log("Successfully updated profiles table.");
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    process.exit(0);
  }
}

run();
