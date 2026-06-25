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
    const { rows } = await client.query(`
      SELECT 
        trigger_name, 
        event_manipulation, 
        event_object_table, 
        action_statement, 
        action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'leads' OR event_object_table = 'client_acquisition'
    `);
    console.log("=== TRIGGERS ===");
    console.log(rows);
  } catch (e) {
    console.error("Error fetching triggers:", e.message);
  } finally {
    await client.end();
  }
}

main();
