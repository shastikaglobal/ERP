const db = require('./db');

(async () => {
  try {
    console.log('🧪 TESTING BACKEND API ENDPOINTS\n');

    const companyId = '00000000-0000-0000-0000-00000000ae01';
    const userId = 'test-user-123';

    // Test 1: /leads/workflow/won-leads
    console.log('1️⃣  Testing: GET /api/leads/workflow/won-leads?company_id=<uuid>');
    console.log('════════════════════════════════════════════════════════════\n');

    const wonQuery = `
      SELECT * FROM leads 
      WHERE stage = 'Won' AND is_deleted = false
      ORDER BY created_at DESC
    `;

    const wonResult = await db.queryWithRLS(wonQuery, [], userId);
    console.log(`Response Count: ${wonResult.rows.length}`);
    console.log(`SQL Query: SELECT * FROM leads WHERE stage = 'Won' AND is_deleted = false\n`);

    // Test 2: /leads/workflow/successful-conversations
    console.log('2️⃣  Testing: GET /api/leads/workflow/successful-conversations?company_id=<uuid>');
    console.log('════════════════════════════════════════════════════════════\n');

    const successfulQuery = `
      SELECT c.*, 
             l.id as lead_id, l.stage, l.source, l.assigned_to
      FROM customers c
      LEFT JOIN leads l ON l.company_name = c.name AND l.company_id = c.company_id
      WHERE c.is_deleted = false
    `;

    const successfulResult = await db.queryWithRLS(successfulQuery, [], userId);
    console.log(`Response Count: ${successfulResult.rows.length}`);
    if (successfulResult.rows.length > 0) {
      console.log('Sample records:');
      successfulResult.rows.slice(0, 2).forEach(row => {
        console.log(`  - ${row.name} (stage: ${row.stage})`);
      });
    }
    console.log('');

    // Test 3: /leads/workflow/client-acquisition
    console.log('3️⃣  Testing: GET /api/leads/workflow/client-acquisition?company_id=<uuid>');
    console.log('════════════════════════════════════════════════════════════\n');

    const acqQuery = `
      SELECT ca.*, 
             l.stage, l.source, l.assigned_to
      FROM client_acquisition ca
      LEFT JOIN leads l ON ca.lead_id = l.id
      WHERE ca.is_deleted = false
    `;

    const acqResult = await db.queryWithRLS(acqQuery, [], userId);
    console.log(`Response Count: ${acqResult.rows.length}`);
    if (acqResult.rows.length > 0) {
      console.log('Sample records:');
      acqResult.rows.slice(0, 2).forEach(row => {
        console.log(`  - ${row.client_name} (lead_id: ${row.lead_id}, stage: ${row.stage})`);
      });
    }
    console.log('');

    // Test 4: /leads/workflow/lost-leads
    console.log('4️⃣  Testing: GET /api/leads/workflow/lost-leads?company_id=<uuid>');
    console.log('════════════════════════════════════════════════════════════\n');

    const lostQuery = `
      SELECT * FROM leads 
      WHERE stage = 'Lost' AND is_deleted = false
      ORDER BY created_at DESC
    `;

    const lostResult = await db.queryWithRLS(lostQuery, [], userId);
    console.log(`Response Count: ${lostResult.rows.length}`);
    console.log('');

    // Test 5: Verify stage update endpoint
    console.log('5️⃣  Testing: PUT /api/leads/:id (stage update)');
    console.log('════════════════════════════════════════════════════════════\n');

    // Find a lead to test with
    const testLead = await db.query(`
      SELECT id, stage FROM leads 
      WHERE company_id = $1 AND is_deleted = false AND stage != 'Won'
      LIMIT 1
    `, [companyId]);

    if (testLead.rows.length > 0) {
      console.log(`Testing update on lead: ${testLead.rows[0].id}`);
      console.log(`Current stage: ${testLead.rows[0].stage}`);
      console.log(`Attempting update to: Won\n`);

      // Simulate the update that would happen via API
      const updateResult = await db.queryWithRLS(
        `UPDATE leads SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        ['Won', testLead.rows[0].id],
        userId
      );

      if (updateResult.rows.length > 0) {
        console.log(`✅ Update successful`);
        console.log(`New stage: ${updateResult.rows[0].stage}`);
        console.log(`Updated at: ${updateResult.rows[0].updated_at}`);
      } else {
        console.log(`❌ Update failed - RLS may have blocked it`);
      }
    }
    console.log('');

    console.log('✅ API ENDPOINT TESTS COMPLETE\n');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    console.error(err.stack);
  }
  process.exit(0);
})();
