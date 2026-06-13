const db = require('../adms-sync/db.js');

async function run() {
  try {
    console.log("Altering attendance_logs table to add updated_at column on VPS...");
    await db.query(`
      ALTER TABLE attendance_logs 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
    `);
    console.log("Successfully added updated_at column!");
  } catch (err) {
    console.error("Error altering table:", err);
  } finally {
    process.exit(0);
  }
}

run();
