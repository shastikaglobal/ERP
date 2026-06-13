const db = require('./db');

(async () => {
  try {
    // Check for successful_conversations table or similar
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND (table_name LIKE '%conversation%' OR table_name LIKE '%acquired%' OR table_name LIKE '%lost%')
      ORDER BY table_name
    `);

    console.log('Conversation/Acquisition related tables:');
    console.log(JSON.stringify(tables.rows, null, 2));

    // Check all tables in public schema
    const allTables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nAll tables in public schema:');
    allTables.rows.forEach(r => console.log('  -', r.table_name));
  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit(0);
})();
