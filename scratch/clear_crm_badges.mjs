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
    await client.query('BEGIN');

    // Clear client_acquisition table
    const acqRes = await client.query('DELETE FROM client_acquisition');
    console.log(`Deleted ${acqRes.rowCount} rows from client_acquisition`);

    // Clear customers table
    const custRes = await client.query('DELETE FROM customers');
    console.log(`Deleted ${custRes.rowCount} rows from customers`);

    await client.query('COMMIT');
    console.log("Transaction committed successfully!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Error clearing tables, transaction rolled back:", e.message);
  } finally {
    await client.end();
  }
}

main();
