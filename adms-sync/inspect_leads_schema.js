const db = require('./db');

(async () => {
  try {
    const cols = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='leads' ORDER BY ordinal_position");
    console.log('COLUMNS:', JSON.stringify(cols.rows, null, 2));
    const rows = await db.query("SELECT id, stage, lead_stage, company_name, contact_name FROM leads LIMIT 5");
    console.log('SAMPLE:', JSON.stringify(rows.rows, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
})();
