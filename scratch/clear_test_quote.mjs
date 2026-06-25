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

    // Delete quotation items first due to foreign key constraints
    const itemsRes = await client.query("DELETE FROM quotation_items WHERE quotation_id = 'e51b64ca-1f82-4198-b0f8-1affb012d29b'");
    console.log(`Deleted ${itemsRes.rowCount} quotation items`);

    // Delete quotation approval logs if any
    const logsRes = await client.query("DELETE FROM quotation_approval_logs WHERE quotation_id = 'e51b64ca-1f82-4198-b0f8-1affb012d29b'");
    console.log(`Deleted ${logsRes.rowCount} quotation approval logs`);

    // Delete the quotation
    const quoteRes = await client.query("DELETE FROM quotations WHERE id = 'e51b64ca-1f82-4198-b0f8-1affb012d29b'");
    console.log(`Deleted ${quoteRes.rowCount} quotations`);

    await client.query('COMMIT');
    console.log("Cleanup committed successfully!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Cleanup failed, transaction rolled back:", e.message);
  } finally {
    await client.end();
  }
}

main();
