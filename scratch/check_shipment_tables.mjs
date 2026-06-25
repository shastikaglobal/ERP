import pg from 'pg';
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

async function run() {
  const pool = new pg.Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: parseInt(env.PG_PORT || '5432', 10),
  });

  try {
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND (
        table_name LIKE '%shipment%' OR 
        table_name LIKE '%dispatch%' OR 
        table_name LIKE '%container%'
      );
    `);
    console.log('VPS database matching tables:', rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error querying VPS database:', err.message);
  } finally {
    await pool.end();
  }
}

run();
