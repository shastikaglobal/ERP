const db = require('../adms-sync/db');

async function run() {
  try {
    const { rows } = await db.query(`
      SELECT * 
      FROM "AttLogs" 
      ORDER BY "LogDateTime" DESC 
      LIMIT 20
    `);
    console.log("Latest 20 entries in AttLogs:");
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
