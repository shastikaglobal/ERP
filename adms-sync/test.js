const db = require('./db');
async function test() {
  const { rows } = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'shipment_events'");
  console.log('shipment_events:', rows);
  process.exit(0);
}
test();
