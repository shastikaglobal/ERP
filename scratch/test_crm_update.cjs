const db = require('../adms-sync/db');

async function test() {
  const id = '9aeb8975-1d5c-4c3b-829d-618540c892a8';
  const updates = { stage: 'Won' };

  try {
    const keys = Object.keys(updates);
    
    if (updates.stage === 'Won' || updates.stage === 'Client Successfully Acquired') {
      const leadCheck = await db.query('SELECT company_id, company_name, country, email FROM leads WHERE id = $1', [id]);
      if (leadCheck.rows.length > 0) {
        const leadData = leadCheck.rows[0];
        console.log("LeadData:", leadData);
        let cmpId = leadData.company_id;
        
        // Simulating the user fetching
        // We will use a known profile id
        const userSub = '8221adbc-3bba-4e56-829f-859a852db715'; // just a mock UUID
        if (!cmpId) {
          const empCheck = await db.query('SELECT company_id FROM profiles LIMIT 1');
          if (empCheck.rows.length > 0) cmpId = empCheck.rows[0].company_id;
        }
        
        console.log("CmpId to use:", cmpId);

        if (cmpId) {
          const custCheck = await db.query('SELECT id FROM customers WHERE email = $1 AND name = $2', [leadData.email, leadData.company_name]);
          if (custCheck.rows.length === 0) {
            console.log("Inserting customer...");
            await db.query(
              `INSERT INTO customers (company_id, name, country, email) VALUES ($1, $2, $3, $4)`,
              [cmpId, leadData.company_name, leadData.country, leadData.email]
            );
            console.log("Inserted customer!");
          } else {
             console.log("Customer already exists.");
          }
        } else {
          console.error("Skipping conversion: no valid company_id found for lead", id);
        }
      }
      updates.stage = 'Client Successfully Acquired';
    }

    console.log("Updates:", updates);
    const setClause = keys.map((key, i) => `"${key}" = $${i + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    
    console.log(`Query: UPDATE leads SET ${setClause} WHERE id = $1`, values);
    await db.query(`UPDATE leads SET ${setClause} WHERE id = $1`, values);
    console.log("Lead updated!");
  } catch (err) {
    console.error("Caught error:", err);
  } finally {
    process.exit();
  }
}

test();
