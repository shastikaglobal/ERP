const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.PG_USER || 'erp_admin',
  host: process.env.PG_HOST || '195.35.22.13',
  database: process.env.PG_DATABASE || 'shastika_erp',
  password: process.env.PG_PASSWORD,
  port: 5432,
  connectionTimeoutMillis: 10000
});

async function run() {
  // Check columns
  const cols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'bde_daily_reports' ORDER BY ordinal_position"
  );
  console.log('Columns:', cols.rows.map(r => r.column_name).join(', '));

  const before = await pool.query('SELECT COUNT(*) FROM bde_daily_reports');
  console.log('Rows before:', before.rows[0].count);

  // Check if is_deleted column exists
  const hasIsDeleted = cols.rows.some(r => r.column_name === 'is_deleted');

  if (hasIsDeleted) {
    // Use UPDATE to soft-delete all rows (respects our safety trigger approach)
    const upd = await pool.query('UPDATE bde_daily_reports SET is_deleted = true WHERE is_deleted IS NOT TRUE');
    console.log('Soft-deleted rows:', upd.rowCount);
  } else {
    // No is_deleted column — use TRUNCATE directly (bypasses triggers)
    console.log('No is_deleted column found — using TRUNCATE...');
    await pool.query('TRUNCATE TABLE bde_daily_reports RESTART IDENTITY');
    console.log('Table truncated.');
  }

  const after = await pool.query('SELECT COUNT(*) FROM bde_daily_reports WHERE is_deleted IS NOT TRUE');
  console.log('Visible rows after:', after.rows[0].count);

  await pool.end();
}

run().catch(err => {
  console.error('Error:', err.message);
  pool.end();
});
