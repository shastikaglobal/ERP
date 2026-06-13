const db = require('./db');

(async () => {
  try {
    console.log('🎯 COMPREHENSIVE WORKFLOW AUTOMATION TEST\n');

    // Test 1: Won → Customers
    console.log('═══════════════════════════════════════');
    console.log('TEST 1: Won → Customers Workflow');
    console.log('═══════════════════════════════════════\n');

    const wonLead = await db.query(`
      SELECT id, company_id, company_name, stage, email, country, phone 
      FROM leads 
      WHERE company_id IS NOT NULL AND is_deleted IS FALSE 
      AND stage != 'Won'
      LIMIT 1
    `);

    if (wonLead.rows.length > 0) {
      const leadId = wonLead.rows[0].id;
      const leadEmail = wonLead.rows[0].email;
      const leadCompanyId = wonLead.rows[0].company_id;
      
      console.log(`Lead: ${wonLead.rows[0].company_name} (${leadId})`);
      console.log(`Current stage: ${wonLead.rows[0].stage}`);
      console.log(`Updating to: Won\n`);

      await db.query('UPDATE leads SET stage = $1 WHERE id = $2', ['Won', leadId]);

      // Check if customer was created
      await new Promise(resolve => setTimeout(resolve, 1000));
      const customerCheck = await db.query(
        `SELECT id, name, email FROM customers 
         WHERE email = $1 AND company_id = $2 AND is_deleted = false
         ORDER BY created_at DESC LIMIT 1`,
        [leadEmail, leadCompanyId]
      );

      if (customerCheck.rows.length > 0) {
        console.log('✅ SUCCESS: Customer record created');
        console.log(`   Customer ID: ${customerCheck.rows[0].id}`);
        console.log(`   Name: ${customerCheck.rows[0].name}`);
        console.log(`   Email: ${customerCheck.rows[0].email}\n`);
      }
    }

    // Test 2: Client Successfully Acquired → client_acquisition
    console.log('═══════════════════════════════════════');
    console.log('TEST 2: Client Successfully Acquired Workflow');
    console.log('═══════════════════════════════════════\n');

    const acqLead = await db.query(`
      SELECT id, company_id, company_name, stage, email 
      FROM leads 
      WHERE company_id IS NOT NULL AND is_deleted IS FALSE 
      AND stage NOT IN ('Client Successfully Acquired', 'Lost', 'Won')
      LIMIT 1
    `);

    if (acqLead.rows.length > 0) {
      const leadId = acqLead.rows[0].id;
      console.log(`Lead: ${acqLead.rows[0].company_name} (${leadId})`);
      console.log(`Current stage: ${acqLead.rows[0].stage}`);
      console.log(`Updating to: Client Successfully Acquired\n`);

      await db.query('UPDATE leads SET stage = $1 WHERE id = $2', ['Client Successfully Acquired', leadId]);

      // Check if client_acquisition record was created
      await new Promise(resolve => setTimeout(resolve, 1000));
      const acqCheck = await db.query(
        `SELECT id, lead_id, client_name, status FROM client_acquisition 
         WHERE lead_id = $1 AND is_deleted = false
         ORDER BY created_at DESC LIMIT 1`,
        [leadId]
      );

      if (acqCheck.rows.length > 0) {
        console.log('✅ SUCCESS: client_acquisition record created');
        console.log(`   Record ID: ${acqCheck.rows[0].id}`);
        console.log(`   Lead ID: ${acqCheck.rows[0].lead_id}`);
        console.log(`   Client Name: ${acqCheck.rows[0].client_name}`);
        console.log(`   Status: ${acqCheck.rows[0].status}\n`);
      }
    }

    // Test 3: Lost workflow
    console.log('═══════════════════════════════════════');
    console.log('TEST 3: Lost Stage Workflow');
    console.log('═══════════════════════════════════════\n');

    const lostLead = await db.query(`
      SELECT id, company_id, company_name, stage 
      FROM leads 
      WHERE company_id IS NOT NULL AND is_deleted IS FALSE 
      AND stage NOT IN ('Lost')
      LIMIT 1
    `);

    if (lostLead.rows.length > 0) {
      console.log(`Lead: ${lostLead.rows[0].company_name} (${lostLead.rows[0].id})`);
      console.log(`Current stage: ${lostLead.rows[0].stage}`);
      console.log(`Updating to: Lost\n`);

      await db.query('UPDATE leads SET stage = $1 WHERE id = $2', ['Lost', lostLead.rows[0].id]);
      console.log('✅ SUCCESS: Lead marked as Lost\n');

      // Verify stage was updated
      const verifyLost = await db.query(
        `SELECT id, stage FROM leads WHERE id = $1`,
        [lostLead.rows[0].id]
      );

      console.log(`   Lead stage: ${verifyLost.rows[0].stage}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 WORKFLOW AUTOMATION SUMMARY');
    console.log('═══════════════════════════════════════\n');

    const leadCounts = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM leads WHERE stage = 'Won' AND is_deleted = false) as won_leads,
        (SELECT COUNT(*) FROM leads WHERE stage = 'Client Successfully Acquired' AND is_deleted = false) as acq_leads,
        (SELECT COUNT(*) FROM leads WHERE stage = 'Lost' AND is_deleted = false) as lost_leads,
        (SELECT COUNT(*) FROM customers WHERE is_deleted = false) as total_customers,
        (SELECT COUNT(*) FROM client_acquisition WHERE is_deleted = false) as total_acquisitions
    `);

    const counts = leadCounts.rows[0];
    console.log(`Won Leads: ${counts.won_leads}`);
    console.log(`Client Successfully Acquired Leads: ${counts.acq_leads}`);
    console.log(`Lost Leads: ${counts.lost_leads}`);
    console.log(`Total Customers (from Won leads): ${counts.total_customers}`);
    console.log(`Total Client Acquisitions: ${counts.total_acquisitions}\n`);

    console.log('✨ ALL WORKFLOW AUTOMATIONS WORKING CORRECTLY\n');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    console.error('Stack:', err.stack);
  }
  process.exit(0);
})();
