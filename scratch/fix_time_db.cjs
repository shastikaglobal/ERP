const db = require('../adms-sync/db');

async function fix() {
  try {
    const res1 = await db.query(`UPDATE attendance_logs SET clock_in = clock_in + interval '5 hours 30 minutes', clock_out = clock_out + interval '5 hours 30 minutes' WHERE date = '2026-06-12' AND is_manual = false RETURNING clock_in;`);
    console.log("Updated rows in attendance_logs:", res1.rows.length);

    const res2 = await db.query(`UPDATE "AttLogs" SET "LogDateTime" = "LogDateTime" + interval '5 hours 30 minutes' WHERE "LogDateTime" >= '2026-06-11' AND "DeviceId" = 'NFZ8250603096' RETURNING "LogDateTime";`);
    console.log("Updated rows in AttLogs:", res2.rows.length);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
fix();
