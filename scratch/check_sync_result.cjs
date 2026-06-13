const db = require('../adms-sync/db');

async function run() {
  try {
    const { rows: profiles } = await db.query(`
      SELECT id, full_name, biometric_id 
      FROM profiles 
      WHERE biometric_id = '1005'
    `);
    console.log("Profile matching '1005':", profiles);

    if (profiles.length > 0) {
      const { rows: logs } = await db.query(`
        SELECT * 
        FROM attendance_logs 
        WHERE employee_id = $1 AND date = '2026-06-12'
      `, [profiles[0].id]);
      console.log("Attendance logs for employee:", logs);
    }

    const { rows: attlogs } = await db.query(`
      SELECT * 
      FROM "AttLogs" 
      WHERE "EmployeeCode" = '1005' 
      ORDER BY "LogDateTime" DESC 
      LIMIT 5
    `);
    console.log("AttLogs for 1005:", attlogs);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
