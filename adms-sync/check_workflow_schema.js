const db = require('./db');

(async () => {
  try {
    // Check client_acquisition table schema
    const clientAcq = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'client_acquisition'
      ORDER BY ordinal_position
    `);

    console.log('client_acquisition table columns:');
    console.log(JSON.stringify(clientAcq.rows, null, 2));

    // Check a sample record if exists
    const sample = await db.query(`
      SELECT * FROM client_acquisition LIMIT 1
    `);
    if (sample.rows.length > 0) {
      console.log('\nSample client_acquisition record:');
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }

    // Check if successful_conversations table exists
    const successConv = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'successful_conversations'
      ORDER BY ordinal_position
    `);

    if (successConv.rows.length > 0) {
      console.log('\nsuccessful_conversations table columns:');
      console.log(JSON.stringify(successConv.rows, null, 2));
    } else {
      console.log('\nNo successful_conversations table found');
      // Check if there's a view or if we need to create a workflow
    }

    // Check customers table (potentially for successful conversions)
    const customers = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `);

    console.log('\ncustomers table columns:');
    console.log(JSON.stringify(customers.rows, null, 2));

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit(0);
})();
