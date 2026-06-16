const db = require('../adms-sync/db');

async function check() {
  try {
    const rawResult = await db.query(
      `SELECT * FROM "AttLogs" WHERE "LogDateTime"::text LIKE '2026-06-16%'`
    );
    console.log('--- Raw AttLogs (June 16, 2026) ---');
    console.log('Count:', rawResult.rows.length);
    console.log(rawResult.rows);

    const logResult = await db.query(
      `SELECT * FROM attendance_logs WHERE date = '2026-06-16'`
    );
    console.log('\n--- attendance_logs (June 16, 2026) ---');
    console.log('Count:', logResult.rows.length);
    console.log(logResult.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
