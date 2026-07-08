const db = require('./adms-sync/db');
async function backfill() {
  const { rows } = await db.query("SELECT id FROM profiles WHERE role IN ('admin', 'director') LIMIT 1");
  const adminId = rows.length > 0 ? rows[0].id : null;
  if (!adminId) return;
  await db.query("UPDATE farmers SET created_by = $1, created_by_name = 'Admin (Backfill)' WHERE created_by IS NULL", [adminId]);
  console.log("Backfilled null farmers to admin id:", adminId);
  process.exit(0);
}
backfill().catch(console.error);
