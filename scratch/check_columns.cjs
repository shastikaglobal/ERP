const db = require('../adms-sync/db');

async function run() {
  try {
    const { rows: attLogsCols } = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'AttLogs'
    `);
    console.log("Columns of 'AttLogs':");
    console.log(attLogsCols);

    const { rows: attendanceLogsCols } = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_logs'
    `);
    console.log("\nColumns of 'attendance_logs':");
    console.log(attendanceLogsCols);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
