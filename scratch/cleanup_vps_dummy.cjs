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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔄 Started cleanup transaction...\n');

    // 1. Leads soft-delete
    const leadsRes = await client.query(`
      UPDATE leads 
      SET is_deleted = true 
      WHERE company_name IN ('dfghjkl;', 'dfdfv', 'rtyuiop[]', 'cfdfhj', 'njij', 'sdfghjkl;,mnb', 'karunya J') 
         OR contact_name = 'karunya J'
      RETURNING id, company_name
    `);
    console.log(`🗑️ Soft-deleted ${leadsRes.rowCount} dummy leads (set is_deleted = true):`);
    leadsRes.rows.forEach(r => console.log(`  - "${r.company_name}" (${r.id})`));

    // 2. Customers cleanup
    const custRes = await client.query(`
      DELETE FROM customers 
      WHERE name IN ('njij', 'cfdfhj', 'rtyuiop[]', 'karunya j', 'karunya J') 
         OR email IN ('seeeee123@gmail.com', 'seeeeee123@gmail.com', 'sreenethra@gmail.com', 'seeeeee123@gmail.com', 'karunyajothiprakash811@gmail.com')
      RETURNING id, name
    `);
    console.log(`\n🗑️ Deleted ${custRes.rowCount} dummy customers:`);
    custRes.rows.forEach(r => console.log(`  - "${r.name}" (${r.id})`));

    // 3. Quotation Items & Quotations cleanup
    const quoteItemsRes = await client.query(`
      DELETE FROM quotation_items 
      WHERE quotation_id IN (SELECT id FROM quotations WHERE quotation_number = 'ertyuiolk6789' OR total_amount = 0 AND quotation_number NOT LIKE 'QT-%')
      RETURNING id
    `);
    console.log(`\n🗑️ Deleted ${quoteItemsRes.rowCount} dummy quotation items`);

    const quoteRes = await client.query(`
      DELETE FROM quotations 
      WHERE quotation_number = 'ertyuiolk6789' OR total_amount = 0 AND quotation_number NOT LIKE 'QT-%'
      RETURNING id, quotation_number
    `);
    console.log(`🗑️ Deleted ${quoteRes.rowCount} dummy quotations:`);
    quoteRes.rows.forEach(r => console.log(`  - "${r.quotation_number}" (${r.id})`));

    // 4. Export Orders cleanup
    const exportOrdersRes = await client.query(`
      DELETE FROM export_orders 
      WHERE is_deleted = true OR customer_name IN ('rtyuiop[]', 'karunya J')
      RETURNING id, order_number
    `);
    console.log(`\n🗑️ Deleted ${exportOrdersRes.rowCount} dummy/deleted export orders:`);
    exportOrdersRes.rows.forEach(r => console.log(`  - "${r.order_number}" (${r.id})`));

    // 5. Shipment Dispatches referencing dummy vehicles/drivers
    const dispatchRes = await client.query(`
      DELETE FROM shipment_dispatches 
      WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vehicle_number IN ('3456789', '98765') OR vehicle_type IN ('fghjukiol;', 'lkjhg'))
         OR driver_id IN (SELECT id FROM drivers WHERE driver_name IN ('kjhgfc', 'AutoDriver4', 'CorrectName', 'NoLicense', 'UserTypedName'))
      RETURNING id, gate_pass_token
    `);
    console.log(`\n🗑️ Deleted ${dispatchRes.rowCount} dummy shipment dispatches:`);
    dispatchRes.rows.forEach(r => console.log(`  - "${r.gate_pass_token}" (${r.id})`));

    // 6. Vehicles & Drivers cleanup
    const vehicleRes = await client.query(`
      DELETE FROM vehicles 
      WHERE vehicle_number IN ('3456789', '98765') OR vehicle_type IN ('fghjukiol;', 'lkjhg')
      RETURNING id, vehicle_number
    `);
    console.log(`\n🗑️ Deleted ${vehicleRes.rowCount} dummy vehicles:`);
    vehicleRes.rows.forEach(r => console.log(`  - "${r.vehicle_number}" (${r.id})`));

    const driverRes = await client.query(`
      DELETE FROM drivers 
      WHERE driver_name IN ('kjhgfc', 'AutoDriver4', 'CorrectName', 'NoLicense', 'UserTypedName')
      RETURNING id, driver_name
    `);
    console.log("Deleted dummy drivers:");
    driverRes.rows.forEach(r => console.log(`  - "${r.driver_name}" (${r.id})`));

    // 7. Damaged Stock cleanup
    const damagedRes = await client.query(`
      DELETE FROM damaged_stock 
      WHERE reported_by = 'doe' OR notes = 'ji' OR warehouse = 'ji'
      RETURNING id, product_name
    `);
    console.log(`\n🗑️ Deleted ${damagedRes.rowCount} dummy damaged stock entries:`);
    damagedRes.rows.forEach(r => console.log(`  - "${r.product_name}" (${r.id})`));

    // 8. Orphaned Attendance Logs
    const attLogsRes = await client.query(`
      DELETE FROM attendance_logs 
      WHERE employee_id NOT IN (SELECT id FROM profiles)
      RETURNING id, date
    `);
    console.log(`\n🗑️ Deleted ${attLogsRes.rowCount} orphaned attendance logs.`);

    // 9. Orphaned Raw Biometric Logs (AttLogs)
    const rawAttLogsRes = await client.query(`
      DELETE FROM "AttLogs" 
      WHERE "EmployeeCode" NOT IN ('1022', '1005', '1003', '1010', '1015', '1006', '1013', '1007', '1021', '1009', '1020', '1008')
      RETURNING "EmployeeCode", "LogDateTime"
    `);
    console.log(`🗑️ Deleted ${rawAttLogsRes.rowCount} orphaned raw biometric punch logs (AttLogs).`);

    // 10. Dummy profiles cleanup
    const profileRes = await client.query(`
      DELETE FROM profiles 
      WHERE email = 'shastikaglobal11@gmail.com'
      RETURNING id, full_name
    `);
    console.log(`\n🗑️ Deleted ${profileRes.rowCount} dummy profiles:`);
    profileRes.rows.forEach(r => console.log(`  - "${r.full_name}" (${r.id})`));

    await client.query('COMMIT');
    console.log('\n🎉 Cleanup completed successfully and transaction committed!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Transaction rolled back due to error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
