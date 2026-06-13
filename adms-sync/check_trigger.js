const db = require('./db');

(async () => {
  try {
    console.log('Checking trigger details...\n');

    // Get trigger info
    const triggers = await db.query(`
      SELECT trigger_name, event_manipulation, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name = 'lead_stage_change_trigger'
    `);

    if (triggers.rows.length > 0) {
      console.log('✅ Trigger found:');
      console.log(JSON.stringify(triggers.rows[0], null, 2));
    } else {
      console.log('❌ Trigger not found!');
    }

    // Check the function
    console.log('\n\nChecking function...\n');
    const funcs = await db.query(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname = 'handle_lead_stage_change'
    `);

    if (funcs.rows.length > 0) {
      console.log('✅ Function found:');
      console.log('Function source (first 500 chars):');
      console.log(funcs.rows[0].prosrc.substring(0, 500));
    }

    // Check recent customer records
    console.log('\n\nRecent customer records:');
    const customers = await db.query(`
      SELECT COUNT(*) as total FROM customers WHERE is_deleted = false
    `);
    console.log(`Total customers: ${customers.rows[0].total}`);

    // Check if the lead is in customers after stage update to Won
    const lead = await db.query(`
      SELECT id, stage FROM leads 
      WHERE id = '692c9938-19de-4b03-abeb-0403707b08a1'
    `);
    
    if (lead.rows.length > 0) {
      console.log(`\nLead stage: ${lead.rows[0].stage}`);
      
      // Check if customer exists for this lead
      const ledgerCustomers = await db.query(`
        SELECT id, name, email FROM customers 
        WHERE email = (SELECT email FROM leads WHERE id = $1)
        LIMIT 1
      `, ['692c9938-19de-4b03-abeb-0403707b08a1']);
      
      if (ledgerCustomers.rows.length > 0) {
        console.log('Customer found:', JSON.stringify(ledgerCustomers.rows[0], null, 2));
      } else {
        console.log('No customer found for this lead');
      }
    }

  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Stack:', err.stack);
  }
  process.exit(0);
})();
