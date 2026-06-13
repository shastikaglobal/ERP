const db = require('./db');

(async () => {
  try {
    // Check lead data
    const leadData = await db.query("SELECT id, company_id, company_name, stage FROM leads LIMIT 5");
    console.log('Sample leads:');
    console.log(JSON.stringify(leadData.rows, null, 2));

    // Find a lead with company_id
    const leadWithCompany = await db.query(
      "SELECT id, company_id, company_name, country, email, phone FROM leads WHERE company_id IS NOT NULL LIMIT 1"
    );
    
    if (leadWithCompany.rows.length > 0) {
      console.log('\nLead with company_id found:');
      console.log(JSON.stringify(leadWithCompany.rows[0], null, 2));
    } else {
      console.log('\nNo leads with company_id found. Need to fix workflow function to handle this.');
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit(0);
})();
