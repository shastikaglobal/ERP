const db = require('./db');
async function test() {
  const { rows } = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'export_shipments'");
  console.log('export_shipments:', rows);
  process.exit(0);
}
test();
