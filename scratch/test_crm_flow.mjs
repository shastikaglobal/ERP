import pg from 'pg';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

const DB_CONFIG = {
  user:     process.env.PG_USER     || 'postgres',
  host:     process.env.PG_HOST     || '195.35.22.13',
  database: process.env.PG_DATABASE || 'shastika_erp',
  password: process.env.PG_PASSWORD || 'Shastika2026',
  port:     parseInt(process.env.PG_PORT || '5432', 10),
  connectionTimeoutMillis: 8000,
};

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log("Connected to VPS DB");

  try {
    console.log("1. Checking initial counts...");
    const acqBefore = await client.query("SELECT COUNT(*) FROM client_acquisition");
    const custBefore = await client.query("SELECT COUNT(*) FROM customers");
    console.log(`  client_acquisition: ${acqBefore.rows[0].count}`);
    console.log(`  customers: ${custBefore.rows[0].count}`);

    console.log("2. Inserting a test lead with stage 'Client Successfully Acquired'...");
    const leadRes = await client.query(`
      INSERT INTO leads (
        id, company_id, company_name, country, assigned_to, stage, created_at, is_deleted
      ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-00000000ae01'::UUID,
        'Test Sync Company',
        'Germany',
        'Test BDE',
        'Client Successfully Acquired',
        NOW(),
        false
      ) RETURNING id
    `);
    const testLeadId = leadRes.rows[0].id;
    console.log(`  Inserted lead with ID: ${testLeadId}`);

    console.log("3. Checking counts after insert...");
    const acqAfter = await client.query("SELECT COUNT(*) FROM client_acquisition");
    const custAfter = await client.query("SELECT COUNT(*) FROM customers");
    console.log(`  client_acquisition: ${acqAfter.rows[0].count}`);
    console.log(`  customers: ${custAfter.rows[0].count}`);

    // Clean up
    console.log("4. Cleaning up test data...");
    await client.query("DELETE FROM client_acquisition WHERE lead_id = $1", [testLeadId]);
    await client.query("DELETE FROM leads WHERE id = $1", [testLeadId]);
    console.log("  Cleaned up!");

  } catch (e) {
    console.error("Test failed:", e.message);
  } finally {
    await client.end();
  }
}

main();
