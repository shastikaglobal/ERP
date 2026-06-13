const db = require('../adms-sync/db');

async function run() {
  try {
    const { rows } = await db.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'fn_attlog_to_attendance'
    `);
    if (rows.length > 0) {
      console.log("Definition of 'fn_attlog_to_attendance':");
      console.log(rows[0].prosrc);
    } else {
      console.log("Function 'fn_attlog_to_attendance' not found.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
