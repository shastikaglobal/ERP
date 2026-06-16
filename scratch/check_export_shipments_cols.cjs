const { Client } = require('pg');
require('dotenv').config({ path: 'd:/ERP/ERP/adms-sync/.env' });

const client = new Client({
  user: 'erp_admin',
  host: process.env.PG_HOST || '195.35.22.13',
  database: 'shastika_erp',
  password: process.env.PG_PASSWORD || 'Shastika2026',
  port: 5432
});

client.connect()
  .then(() => client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='export_shipments' ORDER BY ordinal_position"))
  .then((res) => {
    console.log('Columns in export_shipments:');
    res.rows.forEach(r => console.log(` - ${r.column_name}: ${r.data_type}`));
    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });
