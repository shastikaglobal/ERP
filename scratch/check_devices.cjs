const db = require('../adms-sync/db');

async function check() {
  try {
    const devices = await db.query(
      `SELECT DISTINCT "DeviceId" FROM "AttLogs"`
    );
    console.log('--- Unique Device IDs in AttLogs ---');
    console.log(devices.rows);

    const recentPunches = await db.query(
      `SELECT * FROM "AttLogs" ORDER BY "DownloadDateTime" DESC LIMIT 10`
    );
    console.log('\n--- 10 Most Recent Raw Punches ---');
    console.log(recentPunches.rows);

    const lastSyncDate = await db.query(
      `SELECT MAX("LogDateTime") FROM "AttLogs"`
    );
    console.log('\n--- Max LogDateTime in AttLogs ---');
    console.log(lastSyncDate.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
