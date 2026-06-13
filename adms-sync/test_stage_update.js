const db = require('./db');

(async () => {
  try {
    const lead = await db.query("SELECT id, stage FROM leads WHERE is_deleted IS FALSE LIMIT 1");
    if (!lead.rows.length) {
      console.log('No lead found');
      process.exit(0);
    }
    const id = lead.rows[0].id;
    const current = lead.rows[0].stage;
    console.log('Lead:', id, current);
    const newStage = current === 'New' ? 'Contacted' : 'New';
    const updated = await db.query('UPDATE leads SET stage=$1, updated_at=NOW() WHERE id=$2 RETURNING id, stage', [newStage, id]);
    console.log('Updated:', updated.rows);
  } catch (err) {
    console.error('ERROR:', err);
  }
})();
