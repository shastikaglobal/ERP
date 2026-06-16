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
    // 1. Leads
    const leads = await pool.query("SELECT id, company_name, contact_name, stage FROM leads");
    console.log("--- LEADS ---");
    leads.rows.forEach(r => {
      console.log(`id: ${r.id} | company: "${r.company_name}" | contact: "${r.contact_name}" | stage: "${r.stage}"`);
    });

    // 2. Quotations
    const quotes = await pool.query("SELECT id, quotation_number, status, total_amount FROM quotations");
    console.log("\n--- QUOTATIONS ---");
    quotes.rows.forEach(r => {
      console.log(`id: ${r.id} | number: "${r.quotation_number}" | status: "${r.status}" | total: ${r.total_amount}`);
    });

    // 3. Export Orders
    const orders = await pool.query("SELECT id, order_number, status FROM export_orders");
    console.log("\n--- EXPORT ORDERS ---");
    orders.rows.forEach(r => {
      console.log(`id: ${r.id} | number: "${r.order_number}" | status: "${r.status}"`);
    });

    // 4. Products
    const products = await pool.query("SELECT id, name, sku FROM products");
    console.log("\n--- PRODUCTS ---");
    products.rows.forEach(r => {
      console.log(`id: ${r.id} | name: "${r.name}" | sku: "${r.sku}"`);
    });

    // 5. Customers
    const customers = await pool.query("SELECT id, name, email FROM customers");
    console.log("\n--- CUSTOMERS ---");
    customers.rows.forEach(r => {
      console.log(`id: ${r.id} | name: "${r.name}" | email: "${r.email}"`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
