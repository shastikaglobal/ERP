const db = require('../adms-sync/db');

async function run() {
  try {
    console.log("Updating today's (2026-06-15) attendance logs in database...");
    
    // Update attendance_logs
    const res1 = await db.query(`
      UPDATE attendance_logs 
      SET clock_in = clock_in + interval '5 hours 30 minutes',
          clock_out = clock_out + interval '5 hours 30 minutes'
      WHERE date = '2026-06-15'::date
        AND is_manual = false
      RETURNING id, clock_in, clock_out
    `);
    console.log(`Updated ${res1.rows.length} rows in attendance_logs`);

    // Update AttLogs
    const res2 = await db.query(`
      UPDATE "AttLogs"
      SET "LogDateTime" = "LogDateTime" + interval '5 hours 30 minutes'
      WHERE "DownloadDateTime" >= '2026-06-15 00:00:00'
      RETURNING "EmployeeCode", "LogDateTime"
    `);
    console.log(`Updated ${res2.rows.length} rows in AttLogs`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
