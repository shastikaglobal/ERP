const db = require('./db');

(async () => {
  try {
    // Check the current_company_id function
    const funcDef = await db.query(`
      SELECT 
        n.nspname,
        p.proname,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'current_company_id'
    `);

    console.log('current_company_id() function:');
    if (funcDef.rows.length === 0) {
      console.log('Function not found');
    } else {
      console.log(funcDef.rows[0].definition);
    }

    // Check current_user_id function
    const userFunc = await db.query(`
      SELECT 
        n.nspname,
        p.proname,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'current_user_id'
    `);

    console.log('\ncurrent_user_id() function:');
    if (userFunc.rows.length === 0) {
      console.log('Function not found');
    } else {
      console.log(userFunc.rows[0].definition);
    }

    // Check what custom configs exist
    const configs = await db.query(`
      SELECT current_setting('app.current_company_id', true) as company_id,
             current_setting('app.current_user_id', true) as user_id,
             current_user
    `);

    console.log('\nCurrent session settings:');
    console.log(JSON.stringify(configs.rows[0], null, 2));

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit(0);
})();
