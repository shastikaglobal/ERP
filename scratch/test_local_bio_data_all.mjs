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
  console.log("Running local/VPS bio-data query...");
  try {
    const { rows } = await pool.query(`
      SELECT f.id, f.employee_id, f.face_embedding, f.sample_index, f.quality_score,
             p.id as profile_id, p.full_name, p.email, p.requested_role as role
      FROM face_embeddings f
      LEFT JOIN profiles p ON f.employee_id::text = p.id::text
    `);
    console.log("Query returned rows count:", rows.length);
    if (rows.length > 0) {
      console.log("Sample rows:");
      rows.forEach(r => {
        console.log(`- id=${r.id}, employee_id=${r.employee_id}, profile_id=${r.profile_id}, name=${r.full_name}, email=${r.email}`);
      });
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
