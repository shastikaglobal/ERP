const db = require('../adms-sync/db');

async function run() {
  try {
    console.log("Inserting test punch into 'AttLogs'...");
    // Let's use biometric ID 1005 (or any ID) with a unique timestamp
    const res = await db.query(`
      INSERT INTO "AttLogs" ("EmployeeCode", "LogDateTime", "DownloadDateTime", "Direction", "DeviceId") 
      VALUES ($1, $2, $3, $4, $5)
    `, ['1005', '2026-06-12 19:00:00', new Date().toISOString(), 'in', 'TEST']);
    console.log("Success! Inserted test punch.");
  } catch (err) {
    console.error("Error inserting punch:", err);
  } finally {
    process.exit(0);
  }
}

run();
