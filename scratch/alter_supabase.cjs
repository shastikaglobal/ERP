const { Client } = require('pg');
const dns = require('dns');

async function main() {
  try {
    const ip = await new Promise((resolve, reject) => {
      dns.lookup('db.sxebygxpjzntogzpjnga.supabase.co', { family: 4 }, (err, address) => {
        if (err) reject(err);
        else resolve(address);
      });
    });
    console.log("IPv4 resolved:", ip);

    const client = new Client({
      host: ip,
      port: 6543,
      database: 'postgres',
      user: 'postgres',
      password: 'Shastika2026',
      ssl: { rejectUnauthorized: false }
    });

    console.log("Connecting to Supabase Postgres via IPv4...");
    await client.connect();
    console.log("Connected! Running ALTER TABLE...");
    await client.query('ALTER TABLE quotations ADD COLUMN IF NOT EXISTS created_by UUID;');
    console.log('Success! Column created_by added to quotations in Supabase.');
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
    process.exit();
  }
}

main();
