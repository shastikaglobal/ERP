const db = require('./db');

(async () => {
  try {
    // Get leads table info
    const tableDef = await db.query(`
      SELECT 
        t.relname as table_name,
        t.relrowsecurity,
        t.relfrozenxid
      FROM pg_class t
      WHERE t.relname = 'leads'
    `);

    console.log('Leads Table RLS Status:');
    console.log(JSON.stringify(tableDef.rows, null, 2));

    // Get RLS policies
    const policies = await db.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'leads'
    `);

    console.log('\nLeads Table RLS Policies:');
    if (policies.rows.length === 0) {
      console.log('No RLS policies defined');
    } else {
      console.log(JSON.stringify(policies.rows, null, 2));
    }

    // Get a sample lead and try to update it
    const leadRes = await db.query("SELECT id, stage FROM leads WHERE is_deleted IS FALSE LIMIT 1");
    if (leadRes.rows.length === 0) {
      console.log('\nNo leads found');
      process.exit(0);
    }

    const leadId = leadRes.rows[0].id;
    const oldStage = leadRes.rows[0].stage;
    const newStage = oldStage === 'New' ? 'Contacted' : 'New';

    console.log(`\nTesting direct database update:`);
    console.log(`Lead ID: ${leadId}`);
    console.log(`Current stage: ${oldStage}`);
    console.log(`New stage: ${newStage}`);

    const updateRes = await db.query(
      'UPDATE leads SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING id, stage, updated_at',
      [newStage, leadId]
    );

    if (updateRes.rows.length === 0) {
      console.log('ERROR: Update returned no rows (lead not found or RLS blocked)');
    } else {
      console.log('SUCCESS: Direct update worked');
      console.log('Result:', updateRes.rows[0]);
    }

    // Verify with a select
    const verifyRes = await db.query('SELECT id, stage FROM leads WHERE id = $1', [leadId]);
    console.log('Verification - current stage in DB:', verifyRes.rows[0].stage);

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit(0);
})();
