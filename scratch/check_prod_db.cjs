const { Client } = require('pg');
const client = new Client({ user: 'erp_admin', host: '195.35.22.13', database: 'shastika_erp', password: 'Shastika2026', port: 5432 });

async function run() {
  await client.connect();

  const tables = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('vehicles','drivers','shipment_dispatches','roles','role_permissions','user_roles','user_permissions','profiles') ORDER BY tablename"
  );
  console.log('\n=== TABLES PRESENT ===');
  console.log(tables.rows.map(r => r.tablename).join(', '));

  const roles = await client.query('SELECT id, name, slug FROM roles ORDER BY name');
  console.log('\n=== ROLES IN DB ===');
  roles.rows.forEach(r => console.log(`  [${r.slug}] ${r.name} (id: ${r.id})`));

  const urCount = await client.query('SELECT COUNT(*) as cnt FROM user_roles');
  console.log('\n=== USER_ROLES ASSIGNMENTS ===');
  console.log('  Total rows:', urCount.rows[0].cnt);

  const userRoles = await client.query(
    'SELECT p.full_name, p.email, r.name as role_name, r.slug FROM user_roles ur JOIN profiles p ON p.id = ur.user_id JOIN roles r ON r.id = ur.role_id ORDER BY p.full_name'
  );
  console.log('\n=== USER → ROLE MAPPING ===');
  userRoles.rows.forEach(r => console.log(`  ${r.full_name || '?'} (${r.email}) → ${r.role_name} [${r.slug}]`));

  // Check vehicles/drivers/shipment_dispatches structure
  const dispatchTables = ['vehicles', 'drivers', 'shipment_dispatches'];
  for (const t of dispatchTables) {
    try {
      const cols = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${t}' ORDER BY ordinal_position`
      );
      console.log(`\n=== ${t.toUpperCase()} COLUMNS ===`);
      if (cols.rows.length === 0) {
        console.log('  ❌ TABLE DOES NOT EXIST');
      } else {
        cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
      }
    } catch(e) {
      console.log(`  ❌ ERROR: ${e.message}`);
    }
  }

  await client.end();
}

run().catch(e => console.error('FATAL:', e.message));
