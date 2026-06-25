import pg from 'pg';
import dotenvConfig from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function check() {
  const client = new Client({
    host: 'db.sxebygxpjzntogzpjnga.supabase.co',
    port: 5432,
    user: 'postgres',
    database: 'postgres',
    password: 'Shastika2026',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database.");

    const userId = 'e08aaf46-3ecd-4d88-a5a0-98915fcb394b';

    // 1. Check auth.users
    const userRes = await client.query('SELECT id, email, encrypted_password, email_confirmed_at FROM auth.users WHERE id = $1', [userId]);
    console.log("Auth User Row:", JSON.stringify(userRes.rows[0], null, 2));

    // 2. Check auth.identities
    const identitiesRes = await client.query('SELECT * FROM auth.identities WHERE user_id = $1', [userId]);
    console.log("Auth Identities:", JSON.stringify(identitiesRes.rows, null, 2));

  } catch (err) {
    console.error("Error executing query:", err.message);
  } finally {
    await client.end();
  }
}

check();
