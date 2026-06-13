const db = require('../adms-sync/db.js');

async function run() {
  try {
    console.log("Searching for any occurrences of 'company_id' in functions...");
    const resFunc = await db.query(`
      SELECT routine_name, routine_definition 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_definition LIKE '%company_id%';
    `);
    console.log("Functions containing 'company_id':");
    resFunc.rows.forEach(r => console.log("- " + r.routine_name));

    console.log("\nSearching for any triggers referencing 'company_id'...");
    // Let's check trigger functions
    const resTrig = await db.query(`
      SELECT trigger_name, event_object_table, action_statement
      FROM information_schema.triggers;
    `);
    console.log("All Triggers:");
    console.log(resTrig.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
