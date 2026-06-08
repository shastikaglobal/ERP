import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ override: true });

const env = dotenv.parse(readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const USER_ID = 'dd26a247-4ec7-4263-bbe3-6f1a305f2c1a'; // Narmatha

async function safeCleanTable(table, column, val, isDelete = false) {
  try {
    let query;
    if (isDelete) {
      query = supabase.from(table).delete().eq(column, val);
    } else {
      const updateObj = {};
      updateObj[column] = null;
      query = supabase.from(table).update(updateObj).eq(column, val);
    }
    const { error } = await query;
    if (error) {
      console.log(`ℹ️ Table [${table}] or column [${column}] note: ${error.message}`);
    } else {
      console.log(`✅ Cleaned table [${table}]: set [${column}] to null or deleted references.`);
    }
  } catch (err) {
    console.log(`⚠️ Skip error for table [${table}]:`, err.message);
  }
}

async function run() {
  console.log(`🚀 Starting safe cleanup for User ID: ${USER_ID} (Narmatha)...`);

  const columnsToNull = [
    { table: 'shipment_events', column: 'created_by' },
    { table: 'notifications', column: 'created_by' },
    { table: 'app_notifications', column: 'created_by' },
    { table: 'qc_inspections', column: 'created_by' },
    { table: 'qc_inspections', column: 'inspector_id' },
    { table: 'leads', column: 'assigned_to' },
    { table: 'crm_activities', column: 'created_by' },
    { table: 'purchase_orders', column: 'created_by' },
    { table: 'export_orders', column: 'created_by' },
    { table: 'export_shipments', column: 'created_by' },
    { table: 'quotations', column: 'created_by' },
    { table: 'payments', column: 'created_by' },
    { table: 'customers', column: 'created_by' },
  ];

  for (const item of columnsToNull) {
    await safeCleanTable(item.table, item.column, USER_ID, false);
  }

  const tablesToDelete = [
    { table: 'active_sessions', column: 'user_id' },
    { table: 'zoho_mail_tokens', column: 'user_id' },
    { table: 'zoho_accounts', column: 'user_id' },
    { table: 'app_notifications', column: 'user_id' },
    { table: 'attendance_logs', column: 'employee_id' },
    { table: 'attendance', column: 'profile_id' },
    { table: 'user_roles', column: 'user_id' },
  ];

  for (const item of tablesToDelete) {
    await safeCleanTable(item.table, item.column, USER_ID, true);
  }

  const { error: profErr } = await supabase.from('profiles').delete().eq('id', USER_ID);
  if (profErr) {
    console.error("❌ Failed to delete profile:", profErr.message);
  } else {
    console.log("✅ Profile row deleted successfully.");
  }

  const { error: authErr } = await supabase.auth.admin.deleteUser(USER_ID);
  if (authErr) {
    console.error("❌ Failed to delete auth user:");
    console.dir(authErr, { depth: null });
  } else {
    console.log("🎉 SUCCESS! Auth user and all constraints cleared & deleted successfully.");
  }
}

run();
