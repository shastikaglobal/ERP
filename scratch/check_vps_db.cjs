const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || '195.35.22.13',
  user: 'erp_admin',
  password: process.env.PG_PASSWORD || 'Shastika2026',
  database: 'shastika_erp',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const schemas = await pool.query(
      "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name"
    );
    console.log('Schemas:', schemas.rows.map(x => x.schema_name).join(', '));

    const tables = await pool.query(
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name"
    );
    if (tables.rows.length === 0) {
      console.log('No tables found in VPS DB (shastika_erp)!');
    } else {
      console.log('\nAll tables in shastika_erp:');
      tables.rows.forEach(r => console.log(`  ${r.table_schema}.${r.table_name}`));
    }

    // Check profiles if it exists
    const profilesExist = tables.rows.some(r => r.table_name === 'profiles');
    if (profilesExist) {
      const r3 = await pool.query("SELECT COUNT(*) FROM profiles");
      console.log('\nProfiles count:', r3.rows[0].count);
      const r4 = await pool.query("SELECT id, full_name, email, role, department, is_active FROM profiles LIMIT 5");
      console.log('Sample profiles:');
      r4.rows.forEach(r => console.log(JSON.stringify(r)));
    } else {
      console.log('\nprofiles table does not exist in public schema.');
    }

  } catch (e) {
    console.error('❌ DB error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
