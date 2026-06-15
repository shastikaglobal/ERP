const db = require('../adms-sync/db');

async function run() {
  try {
    console.log("=== LATEST 20 PUNCHES IN AttLogs ===");
    const { rows: attLogs } = await db.query(`
      SELECT "EmployeeCode", "LogDateTime", "DownloadDateTime", "Direction", "DeviceId"
      FROM "AttLogs"
      ORDER BY "LogDateTime" DESC
      LIMIT 20
    `);
    console.log(attLogs);

    console.log("\n=== TODAY'S attendance_logs ===");
    const { rows: attLogsDb } = await db.query(`
      SELECT al.*, p.full_name
      FROM attendance_logs al
      JOIN profiles p ON al.employee_id = p.id
      WHERE al.date = '2026-06-15' OR al.date = '2026-06-14'
      ORDER BY al.date DESC, al.clock_in DESC
    `);
    console.log(attLogsDb);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
