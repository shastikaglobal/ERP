require('dotenv').config();
const { Client } = require('pg');

const SECTION_MAPPING = {
  "DASHBOARDS": ["Executive & Activities", "Sales Analytics", "Shipment Analytics", "Financial Overview", "Employee Productivity", "Roles & Permissions"],
  "FARMERS": ["Farmers List", "Create Farmer", "Convert to Customer"],
  "CRM": ["Dashboard", "Leads", "Pipelines", "Follow-Ups", "Communication", "Client Acquisition", "Successful Conversation", "Client Success", "Customer Database", "Task", "Reports", "Mail Box", "Email Integration", "Advanced Security", "Zoho API Sync"],
  "MOBILE CRM": ["Mobile Login", "Push Notifications", "Call Logging", "GPS Tracking", "IP Tracking", "Device Authorization"],
  "PROCUREMENT": ["Dashboard", "Purchase Orders", "Suppliers"],
  "WAREHOUSE & INVENTORY": ["Dashboard", "Receiving Goods", "Available Stock Management", "Reserved Stock Tracking", "Export Ready Inventory", "Batch-wise Stock Tracking", "Damaged Stock Management", "Expiry Monitoring", "Multi-Warehouse Management", "Packing Management", "Inspection", "New Inspection", "Approvals", "WH Quality Control", "Container Loading", "Dispatch", "Shipment Register", "Create Shipment", "Container Tracking", "Delivery Status", "Barcodes", "Generate QR", "Scan", "Quotations", "Create Quotation", "Convert to Order", "Orders", "Create Order", "Status Tracking", "Fulfillment", "Invoices", "Packing Lists", "Certificate of Origin", "Document Viewer"],
  "FINANCE": ["Payment Register", "Overdue", "Multi-Currency Ledger", "Financial Reports"],
  "TALLY": ["Tally Module", "Counts"],
  "ACCOUNTS": ["Journal Entry", "Ledger", "Trial Balance"],
  "MASTERS": ["Parties", "Chart of Accounts"],
  "HR & EMPLOYEES": ["Directory", "Attendance", "Salary Report", "Face Attendance", "Register Face"],
  "SYSTEM": ["Notifications", "Activity Logs", "Subscriptions", "Settings", "Zoho Integration", "System Reset"]
};

async function grantAll() {
  const client = new Client({
    host: '195.35.22.13',
    port: 5432,
    user: 'erp_admin',
    password: process.env.PG_PASSWORD,
    database: 'shastika_erp'
  });

  await client.connect();

  // Get user 2001's UUID
  const { rows } = await client.query("SELECT id FROM profiles WHERE employee_id = '2001'");
  if (rows.length === 0) {
    console.log('User 2001 not found');
    await client.end();
    return;
  }
  const userId = rows[0].id;
  console.log('User 2001 UUID:', userId);

  let count = 0;
  for (const [section, subs] of Object.entries(SECTION_MAPPING)) {
    for (const sub of subs) {
      const permKey = `${section}__${sub}`;
      await client.query(
        `INSERT INTO user_permissions (user_id, section, has_access, granted_by, updated_at)
         VALUES ($1, $2, true, $1, NOW())
         ON CONFLICT (user_id, section) 
         DO UPDATE SET has_access = true, updated_at = NOW()`,
        [userId, permKey]
      );
      count++;
    }
  }

  console.log(`Granted ${count} permissions to user 2001 (${userId})`);
  await client.end();
}

grantAll().catch(console.error);
