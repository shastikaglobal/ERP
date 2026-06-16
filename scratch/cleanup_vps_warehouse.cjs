const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/ERP/ERP/adms-sync/.env' });

const pool = new Pool({
  user: 'erp_admin',
  host: process.env.PG_HOST || '195.35.22.13',
  database: 'shastika_erp',
  password: process.env.PG_PASSWORD || 'Shastika2026',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔄 Started warehouse tables cleanup transaction...\n');

    // 1. Delete from available_stock
    const resAvailable = await client.query('DELETE FROM available_stock');
    console.log(`🗑️ Deleted ${resAvailable.rowCount} rows from available_stock`);

    // 2. Delete from reserved_stock
    const resReserved = await client.query('DELETE FROM reserved_stock');
    console.log(`🗑️ Deleted ${resReserved.rowCount} rows from reserved_stock`);

    // 3. Delete from export_ready_inventory
    const resExportReady = await client.query('DELETE FROM export_ready_inventory');
    console.log(`🗑️ Deleted ${resExportReady.rowCount} rows from export_ready_inventory`);

    // 4. Delete from qc_inspections
    const resQc = await client.query('DELETE FROM qc_inspections');
    console.log(`🗑️ Deleted ${resQc.rowCount} rows from qc_inspections`);

    // 5. Delete from inventory_batches
    const resBatches = await client.query('DELETE FROM inventory_batches');
    console.log(`🗑️ Deleted ${resBatches.rowCount} rows from inventory_batches`);

    // 6. Delete from shipment_batches
    const resShipmentBatches = await client.query('DELETE FROM shipment_batches');
    console.log(`🗑️ Deleted ${resShipmentBatches.rowCount} rows from shipment_batches`);

    // 7. Delete from expiry_monitoring
    const resExpiry = await client.query('DELETE FROM expiry_monitoring');
    console.log(`🗑️ Deleted ${resExpiry.rowCount} rows from expiry_monitoring`);

    // 8. Delete from warehouse_stock
    const resStock = await client.query('DELETE FROM warehouse_stock');
    console.log(`🗑️ Deleted ${resStock.rowCount} rows from warehouse_stock`);

    // 9. Delete from damaged_stock
    const resDamaged = await client.query('DELETE FROM damaged_stock');
    console.log(`🗑️ Deleted ${resDamaged.rowCount} rows from damaged_stock`);

    // 10. Clean up dummy activity logs referencing deleted items
    const resLogs = await client.query(`
      DELETE FROM activity_logs 
      WHERE action ILIKE '%Osaka Electronics%'
         OR action ILIKE '%dfghj%'
         OR action ILIKE '%rtyuiop%'
         OR action ILIKE '%karunya J%'
         OR action ILIKE '%cfdfhj%'
         OR actor_name = 'shastikaglobal 11'
    `);
    console.log(`🗑️ Deleted ${resLogs.rowCount} dummy rows from activity_logs`);

    await client.query('COMMIT');
    console.log('\n🎉 Warehouse cleanup completed successfully and transaction committed!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Transaction rolled back due to error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
