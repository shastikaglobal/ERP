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
    const res = await client.query("UPDATE quotations SET status = 'Approved' WHERE quotation_number = 'QT-2026-5752' RETURNING *");
    console.log("Updated Quotation successfully!");
    console.log(res.rows[0]);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await client.end();
  }
}

main();
