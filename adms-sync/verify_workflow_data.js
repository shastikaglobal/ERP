const db = require('./db');

(async () => {
  try {
    console.log('🔍 VERIFYING WORKFLOW ENDPOINTS DATA\n');

    // Get a test company_id
    const company = await db.query(`
      SELECT DISTINCT company_id FROM leads 
      WHERE company_id IS NOT NULL AND is_deleted = false LIMIT 1
    `);

    if (company.rows.length === 0) {
      console.log('❌ No company found');
      process.exit(1);
    }

    const companyId = company.rows[0].company_id;
    console.log(`Test Company ID: ${companyId}\n`);

    // Test 1: Won Leads (Client Success)
    console.log('1️⃣  TESTING: Won Leads for Client Success');
    console.log('═══════════════════════════════════════════\n');

    const wonLeads = await db.query(`
      SELECT id, company_id, company_name, stage, email, country, assigned_to, created_at
      FROM leads 
      WHERE stage = 'Won' AND company_id = $1 AND is_deleted = false
      ORDER BY created_at DESC
    `, [companyId]);

    console.log(`Won Leads Count: ${wonLeads.rows.length}`);
    if (wonLeads.rows.length > 0) {
      console.log('Sample Won Leads:');
      wonLeads.rows.slice(0, 3).forEach(lead => {
        console.log(`  - ${lead.company_name} (${lead.email}) [${lead.stage}]`);
      });
    }
    console.log('');

    // Test 2: Client Successfully Acquired Leads (Client Acquisition)
    console.log('2️⃣  TESTING: Client Successfully Acquired Leads');
    console.log('═══════════════════════════════════════════\n');

    const acqLeads = await db.query(`
      SELECT id, company_id, company_name, stage, email, country, assigned_to, created_at
      FROM leads 
      WHERE stage = 'Client Successfully Acquired' AND company_id = $1 AND is_deleted = false
      ORDER BY created_at DESC
    `, [companyId]);

    console.log(`Client Successfully Acquired Leads Count: ${acqLeads.rows.length}`);
    if (acqLeads.rows.length > 0) {
      console.log('Sample Leads:');
      acqLeads.rows.slice(0, 3).forEach(lead => {
        console.log(`  - ${lead.company_name} (${lead.email}) [${lead.stage}]`);
      });
    }
    console.log('');

    // Test 3: Check customers table (should have Won leads)
    console.log('3️⃣  TESTING: Customers Table (Should have Won leads)');
    console.log('═══════════════════════════════════════════\n');

    const customers = await db.query(`
      SELECT id, company_id, name, email, created_at
      FROM customers 
      WHERE company_id = $1 AND is_deleted = false
      ORDER BY created_at DESC
    `, [companyId]);

    console.log(`Total Customers Count: ${customers.rows.length}`);
    if (customers.rows.length > 0) {
      console.log('Sample Customers:');
      customers.rows.slice(0, 3).forEach(cust => {
        console.log(`  - ${cust.name} (${cust.email})`);
      });
    }
    console.log('');

    // Test 4: Check client_acquisition table
    console.log('4️⃣  TESTING: Client Acquisition Table');
    console.log('═══════════════════════════════════════════\n');

    const clientAcq = await db.query(`
      SELECT ca.id, ca.lead_id, ca.client_name, ca.status, ca.created_at
      FROM client_acquisition ca
      LEFT JOIN leads l ON ca.lead_id = l.id
      WHERE l.company_id = $1 AND ca.is_deleted = false
      ORDER BY ca.created_at DESC
    `, [companyId]);

    console.log(`Total Client Acquisitions Count: ${clientAcq.rows.length}`);
    if (clientAcq.rows.length > 0) {
      console.log('Sample Client Acquisitions:');
      clientAcq.rows.slice(0, 3).forEach(acq => {
        console.log(`  - ${acq.client_name} (Lead: ${acq.lead_id}) [${acq.status}]`);
      });
    }
    console.log('');

    // Test 5: Stage distribution
    console.log('5️⃣  TESTING: Stage Distribution');
    console.log('═══════════════════════════════════════════\n');

    const stages = await db.query(`
      SELECT stage, COUNT(*) as count
      FROM leads
      WHERE company_id = $1 AND is_deleted = false
      GROUP BY stage
      ORDER BY count DESC
    `, [companyId]);

    console.log('Stage Distribution:');
    stages.rows.forEach(row => {
      console.log(`  ${row.stage}: ${row.count}`);
    });
    console.log('');

    console.log('✅ VERIFICATION COMPLETE\n');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    console.error(err.stack);
  }
  process.exit(0);
})();
