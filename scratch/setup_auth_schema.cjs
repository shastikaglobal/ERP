const db = require('../adms-sync/db.js');

async function run() {
  try {
    console.log("Creating auth schema and uid() function on the VPS database...");
    await db.query(`CREATE SCHEMA IF NOT EXISTS auth;`);
    await db.query(`
      CREATE OR REPLACE FUNCTION auth.uid()
      RETURNS uuid
      LANGUAGE sql STABLE
      AS $$
        SELECT null::uuid;
      $$;
    `);
    console.log("auth schema and auth.uid() successfully created!");
  } catch (err) {
    console.error("Error creating auth schema/function:", err);
  } finally {
    process.exit(0);
  }
}

run();
