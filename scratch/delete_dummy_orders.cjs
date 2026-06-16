const { Client } = require('pg');
const client = new Client({
  user: 'erp_admin',
  host: '195.35.22.13',
  database: 'shastika_erp',
  password: 'Shastika2026',
  port: 5432,
});
client.connect()
  .then(() => client.query("DELETE FROM export_orders WHERE order_number IN ('EXP-2026-846', 'EXP-2026-933', 'EXP-2026-963', 'EXP-2026-954', 'EXP-2026-791', 'EXP-2026-121')"))
  .then(res => {
    console.log('✅ Deleted ' + res.rowCount + ' dummy orders.');
    client.end();
  })
  .catch(err => {
    console.error('❌ Failed:', err.message);
  });
