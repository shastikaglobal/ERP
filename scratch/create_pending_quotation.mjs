import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

async function run() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Connect to VPS database
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    // 1. Get profile/company info to match user
    console.log('Fetching profiles...');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_id')
      .eq('email', 'karunyaajothiprakash@gmail.com');
    
    const companyId = profiles?.[0]?.company_id || '00000000-0000-0000-0000-00000000ae01';
    console.log(`Using Company ID: ${companyId}`);

    // 2. Create a test customer if none exists
    let customerId;
    
    // Check VPS Customers
    const { rows: vpsCusts } = await pool.query('SELECT id FROM customers LIMIT 1');
    if (vpsCusts.length === 0) {
      console.log('Creating test customer in VPS...');
      const insRes = await pool.query(
        "INSERT INTO customers (company_id, name, email, phone, address, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [companyId, 'Global Trade Corp', 'info@globaltrade.com', '+1234567890', '123 Export Lane', 'USA']
      );
      customerId = insRes.rows[0].id;
    } else {
      customerId = vpsCusts[0].id;
    }

    // Check Supabase Customers
    const { data: sbCusts } = await supabase.from('customers').select('id').limit(1);
    if (!sbCusts || sbCusts.length === 0) {
      console.log('Creating test customer in Supabase...');
      const { data: sbCust, error: sbCustErr } = await supabase
        .from('customers')
        .insert({
          id: customerId, // keep IDs in sync
          company_id: companyId,
          name: 'Global Trade Corp',
          email: 'info@globaltrade.com',
          phone: '+1234567890',
          address: '123 Export Lane',
          country: 'USA'
        })
        .select();
      if (sbCustErr) console.error('Supabase customer creation failed:', sbCustErr.message);
    }

    // 3. Get a product
    const { rows: vpsProds } = await pool.query('SELECT id, name FROM products LIMIT 1');
    const productId = vpsProds[0]?.id;
    const productName = vpsProds[0]?.name || 'Cavendish Bananas';

    // 4. Create Pending Quotation
    const qNumber = `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    console.log(`Creating Pending Quotation ${qNumber}...`);

    // Insert into VPS
    const vpsQRes = await pool.query(
      `INSERT INTO quotations (company_id, quotation_number, customer_id, status, amount, subtotal, tax_amount, items_count, total_amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [companyId, qNumber, customerId, 'Pending', 15000, 15000, 0, 1, 15000, 'USD']
    );
    const qId = vpsQRes.rows[0].id;

    await pool.query(
      `INSERT INTO quotation_items (quotation_id, product_id, product_name, description, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [qId, productId, productName, 'Premium grade export bananas', 1000, 15, 15000]
    );
    console.log('✅ Inserted pending quotation into VPS database.');

    // Insert into Supabase (for sync/integrity)
    const { error: sbQErr } = await supabase
      .from('quotations')
      .insert({
        id: qId,
        company_id: companyId,
        quotation_number: qNumber,
        customer_id: customerId,
        status: 'Pending',
        amount: 15000,
        subtotal: 15000,
        tax_amount: 0,
        items_count: 1,
        total_amount: 15000,
        currency: 'USD'
      });
    
    if (sbQErr) {
      console.error('Supabase quotation insert failed:', sbQErr.message);
    } else {
      await supabase
        .from('quotation_items')
        .insert({
          quotation_id: qId,
          product_id: productId,
          product_name: productName,
          description: 'Premium grade export bananas',
          quantity: 1000,
          unit_price: 15,
          total_price: 15000
        });
      console.log('✅ Inserted pending quotation into Supabase.');
    }

  } catch (err) {
    console.error('Error during insert:', err.message);
  } finally {
    await pool.end();
  }
}

run();
