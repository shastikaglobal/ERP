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

  const tables = ['client_acquisition', 'leads', 'customers'];
  for (const table of tables) {
    try {
      const { rows } = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      const { rows: undeleted } = await client.query(`SELECT COUNT(*) as count FROM ${table} WHERE is_deleted IS NOT TRUE`);
      console.log(`Table ${table}: total = ${rows[0].count}, undeleted = ${undeleted[0].count}`);
    } catch (e) {
      console.error(`Error querying ${table}:`, e.message);
    }
  }

  // Also query the active counts using the exact queries from backend:
  try {
    const acq = await client.query(`SELECT COUNT(*) as count FROM client_acquisition ca WHERE ca.is_deleted IS NOT TRUE`);
    const conv = await client.query(`SELECT COUNT(*) as count FROM leads WHERE is_deleted IS NOT TRUE AND stage IN ('Won', 'Client Successfully Acquired')`);
    const cust = await client.query(`SELECT COUNT(*) as count FROM customers WHERE is_deleted IS NOT TRUE`);
    console.log(`Backend queries:`);
    console.log(`  clientAcq: ${acq.rows[0].count}`);
    console.log(`  conversions: ${conv.rows[0].count}`);
    console.log(`  customers: ${cust.rows[0].count}`);
  } catch (e) {
    console.error("Error running backend queries:", e.message);
  }

  await client.end();
}
main();
