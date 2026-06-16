const { Client } = require('pg');

const client = new Client({
  user: 'erp_admin',
  host: '195.35.22.13',
  database: 'shastika_erp',
  password: 'Shastika2026',
  port: 5432
});

async function main() {
  await client.connect();
  const testQuery = await client.query(
    "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'is_deleted'",
    ['packing_protocols']
  );
  console.log('Query Result:', testQuery.rows);
  await client.end();
}

main().catch(console.error);
