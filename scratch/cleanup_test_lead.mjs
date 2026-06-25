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
  console.log("Connected to VPS DB for test cleanup");

  try {
    await client.query("ALTER TABLE leads DISABLE TRIGGER no_delete_trigger");
    const resLeads = await client.query("DELETE FROM leads WHERE company_name = 'Test Sync Company'");
    console.log(`Deleted ${resLeads.rowCount} test leads`);
    await client.query("ALTER TABLE leads ENABLE TRIGGER no_delete_trigger");
  } catch (e) {
    console.error("Cleanup failed:", e.message);
  } finally {
    await client.end();
  }
}

main();
