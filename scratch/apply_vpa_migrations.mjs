import pg from 'pg';
const { Client } = pg;

async function run() {
  const client = new Client({
    user: 'postgres',
    host: '195.35.22.13',
    database: 'shastika_erp',
    password: 'Shastika2026',
    port: 5432,
  });

  try {
    await client.connect();
    console.log("📡 Connected to VPS DB successfully.");

    console.log("Creating table 'invoice_items'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
        product_id UUID,
        quantity NUMERIC,
        unit_price NUMERIC,
        total_price NUMERIC
      );
    `);
    console.log("✅ Table 'invoice_items' verified/created.");

    console.log("Creating table 'categories'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log("✅ Table 'categories' verified/created.");

    // Perform a verification query
    const verifyRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('invoice_items', 'categories');
    `);
    console.log("Verified tables in database:", verifyRes.rows.map(r => r.table_name));

  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
