const db = require('../adms-sync/db');

async function run() {
  try {
    const { rows: logs } = await db.query(`
      SELECT al.*, p.full_name, p.biometric_id
      FROM attendance_logs al
      JOIN profiles p ON al.employee_id = p.id
      WHERE al.date >= '2026-06-01'
      ORDER BY al.date DESC, p.full_name ASC
    `);
    console.log(`Found ${logs.length} attendance logs since June 1, 2026:`);
    for (const log of logs) {
      console.log(`Date: ${log.date.toISOString().slice(0,10)} | Name: ${log.full_name} (Bio: ${log.biometric_id}) | In: ${log.clock_in} | Out: ${log.clock_out} | Status: ${log.status} | Manual: ${log.is_manual} | Notes: ${log.notes}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
