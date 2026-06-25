import pg from 'pg';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || '195.35.22.13',
  database: process.env.PG_DATABASE || 'shastika_erp',
  password: process.env.PG_PASSWORD || 'Shastika2026',
  port: parseInt(process.env.PG_PORT || '5432', 10),
});

async function main() {
  console.log("Updating local/VPS PG profiles table for karunya...");
  try {
    const res = await pool.query(
      `UPDATE profiles SET system_mode = 'wfh' WHERE id = $1 RETURNING *`,
      ['59df2897-02e4-4ab3-80ba-dc016642ba04']
    );
    console.log("VPS DB Profile Updated rows:", res.rows);
  } catch (err) {
    console.error("VPS DB Error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
